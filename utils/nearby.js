/**
 * 附近餐馆搜索：基于腾讯位置服务 WebService API
 *
 * 启用步骤：
 * 1. lbs.qq.com 注册 → 控制台「应用管理-我的应用」创建应用并添加 Key，
 *    勾选「WebServiceAPI」，域名白名单可留空或授权小程序。
 * 2. 把 Key 填到下方 LBS_KEY。
 * 3. 小程序后台「开发管理-开发设置-服务器域名」把 https://apis.map.qq.com
 *    加入 request 合法域名（开发阶段可在工具里勾选"不校验合法域名"）。
 * 4. 小程序后台「设置-服务内容声明-用户隐私保护指引」声明"位置信息"。
 *
 * 定位策略：个人主体难以获批 wx.getLocation，这里用无需申请的
 * wx.chooseLocation（打开地图默认定位当前位置，用户点确定即可），
 * 结果缓存 30 分钟，期间再次抽签自动复用，体验接近全自动。
 */
var logger = require('./logger.js');

var LBS_KEY = 'HYVBZ-IBJWM-X2T6Y-6NHX2-O65Q2-XUBQU'; // 腾讯位置服务 Key，附近功能已启用

var LOCATION_CACHE_KEY = 'cached_user_location';
var LOCATION_TTL = 30 * 60 * 1000; // 位置缓存 30 分钟

// 是否已配置 Key（未配置时页面隐藏附近功能）
function isEnabled() {
  return !!LBS_KEY;
}

// 读取未过期的缓存位置，无则返回 null
function getCachedLocation() {
  var cached = wx.getStorageSync(LOCATION_CACHE_KEY);
  if (cached && cached.latitude && (Date.now() - cached.timestamp) < LOCATION_TTL) {
    return cached;
  }
  return null;
}

// 打开地图让用户确认位置（无需后台接口申请），成功后写缓存
function chooseLocation(callback) {
  wx.chooseLocation({
    success: function(res) {
      var loc = { latitude: res.latitude, longitude: res.longitude, timestamp: Date.now() };
      wx.setStorageSync(LOCATION_CACHE_KEY, loc);
      logger.info('nearby', '用户确认位置 ' + res.latitude + ',' + res.longitude);
      callback(loc);
    },
    fail: function(err) {
      // 用户取消或未授权位置权限
      logger.warn('nearby', 'chooseLocation 取消/失败', err);
      var msg = (err && err.errMsg) || '';
      // 主动取消不打扰；真实错误（隐私未声明/权限被拒）给出可见提示
      if (msg.indexOf('cancel') === -1) {
        wx.showToast({
          title: msg.indexOf('privacy') !== -1
            ? '需先在后台配置隐私保护指引'
            : '获取位置失败：' + msg,
          icon: 'none',
          duration: 3000
        });
      }
      callback(null);
    }
  });
}

// 周边关键词搜索，按距离升序返回（最多 5 条），失败返回空数组
function searchNearby(keyword, latitude, longitude, callback) {
  wx.request({
    url: 'https://apis.map.qq.com/ws/place/v1/search',
    data: {
      key: LBS_KEY,
      keyword: keyword,
      // nearby(纬度,经度,半径米,auto_extend=1 无结果自动扩大范围)
      boundary: 'nearby(' + latitude + ',' + longitude + ',3000,1)',
      orderby: '_distance',
      page_size: 5
    },
    success: function(res) {
      var body = res.data;
      if (body && body.status === 0 && body.data && body.data.length > 0) {
        logger.info('nearby', '搜到 ' + body.data.length + ' 家「' + keyword + '」');
        callback(body.data);
      } else {
        logger.warn('nearby', '无结果或接口报错', body && body.message);
        callback([]);
      }
    },
    fail: function(err) {
      // 常见原因：域名未加白名单 / Key 未开通 WebServiceAPI
      logger.warn('nearby', '搜索请求失败', err);
      callback([]);
    }
  });
}

// 距离格式化：850 → "850m"，1260 → "1.3km"
function formatDistance(meters) {
  if (meters == null) return '';
  if (meters < 1000) return Math.round(meters) + 'm';
  return (meters / 1000).toFixed(1) + 'km';
}

module.exports = {
  isEnabled: isEnabled,
  getCachedLocation: getCachedLocation,
  chooseLocation: chooseLocation,
  searchNearby: searchNearby,
  formatDistance: formatDistance
};
