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
// 先主动触发隐私授权弹窗（基础库 2.32.3+），真机调试下被动弹窗经常不出来
function chooseLocation(callback) {
  if (wx.requirePrivacyAuthorize) {
    wx.requirePrivacyAuthorize({
      success: function() { doChooseLocation(callback); },
      fail: function(err) {
        logger.warn('nearby', '用户拒绝隐私授权', err);
        wx.showToast({ title: '需同意隐私协议才能使用定位', icon: 'none', duration: 3000 });
        callback(null);
      }
    });
  } else {
    doChooseLocation(callback);
  }
}

function doChooseLocation(callback) {
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
      // 主动取消不打扰；真实失败给友好提示
      if (msg.indexOf('cancel') === -1) {
        wx.showToast({ title: '打开地图失败，请检查微信的定位权限', icon: 'none', duration: 3000 });
      }
      callback(null);
    }
  });
}

// 周边关键词搜索，按距离升序返回（最多 6 条）
// callback(list, errMsg)：errMsg 仅在接口/网络报错时有值（区别于"正常无结果"）
function searchNearby(keyword, latitude, longitude, callback) {
  wx.request({
    url: 'https://apis.map.qq.com/ws/place/v1/search',
    data: {
      key: LBS_KEY,
      keyword: keyword,
      // nearby(纬度,经度,半径米,auto_extend=1 无结果自动扩大范围)
      boundary: 'nearby(' + latitude + ',' + longitude + ',3000,1)',
      orderby: '_distance',
      page_size: 6
    },
    success: function(res) {
      var body = res.data;
      if (body && body.status === 0 && body.data && body.data.length > 0) {
        logger.info('nearby', '搜到 ' + body.data.length + ' 家「' + keyword + '」');
        callback(body.data, null);
      } else if (body && body.status !== 0) {
        // Key 配额超限/未开通/签名错误等，继续换词也没用
        logger.warn('nearby', '接口报错 status=' + body.status, body.message);
        callback([], '接口错误(' + body.status + '): ' + (body.message || '未知'));
      } else {
        logger.warn('nearby', '「' + keyword + '」无结果');
        callback([], null);
      }
    },
    fail: function(err) {
      // 常见原因：域名未加白名单 / Key 未开通 WebServiceAPI
      logger.warn('nearby', '搜索请求失败', err);
      callback([], '网络请求失败: ' + ((err && err.errMsg) || ''));
    }
  });
}

// 菜名 → 可搜索品类词（菜名过于具体时 POI 库搜不到，降级为品类搜索）
// 顺序敏感：越具体的规则放越前
var SEARCH_RULES = [
  ['汉堡', '汉堡'], ['堡', '汉堡'], ['披萨', '披萨'], ['比萨', '披萨'],
  ['牛排', '牛排'], ['意面', '意大利面'], ['意大利', '意大利面'],
  ['寿司', '寿司'], ['刺身', '日本料理'], ['三文鱼', '日本料理'],
  ['拉面', '拉面'], ['咖喱', '咖喱'],
  ['鳗鱼', '日本料理'], ['牛丼', '日本料理'], ['天妇罗', '日本料理'], ['定食', '日本料理'],
  ['石锅', '韩国料理'], ['部队锅', '韩国料理'], ['泡菜', '韩国料理'],
  ['紫菜包饭', '韩国料理'], ['韩式', '韩国料理'],
  ['炸鸡', '炸鸡'], ['鸡翅', '炸鸡'], ['鸡排', '鸡排'], ['鸡腿', '炸鸡'], ['鸡肉卷', '汉堡'],
  ['麻辣烫', '麻辣烫'], ['冒菜', '冒菜'], ['香锅', '麻辣香锅'], ['串串', '串串香'], ['火锅', '火锅'],
  ['烤肉', '烤肉'], ['烧腊', '烧腊'], ['烧鹅', '烧腊'], ['叉烧', '烧腊'], ['烤鸭', '烤鸭'], ['烧烤', '烧烤'],
  ['沙拉', '轻食沙拉'], ['三明治', '轻食沙拉'], ['藜麦', '轻食沙拉'], ['燕麦', '轻食沙拉'], ['轻食', '轻食沙拉'],
  ['粥', '粥'], ['肠粉', '肠粉'], ['河粉', '米粉'], ['米粉', '米粉'], ['米线', '米线'],
  ['云吞', '馄饨'], ['馄饨', '馄饨'], ['饺', '饺子'], ['烧麦', '早茶'],
  ['酸辣粉', '酸辣粉'], ['螺蛳粉', '螺蛳粉'], ['面', '面馆'],
  ['煎饼', '煎饼'], ['肉夹馍', '肉夹馍'], ['炒饭', '炒饭'], ['沙县', '沙县小吃'],
  ['饭', '快餐'], ['鸡', '炸鸡'], ['肉', '餐馆']
];

// 生成降级关键词链：原名 → 去掉套餐类后缀 → 品类词 → 兜底「美食」
function buildKeywordChain(name) {
  var chain = [name];
  var stripped = name.replace(/套餐|定食|拼盘|双拼|全家桶|单人餐/g, '');
  if (stripped && stripped !== name) chain.push(stripped);
  for (var i = 0; i < SEARCH_RULES.length; i++) {
    if (name.indexOf(SEARCH_RULES[i][0]) !== -1) {
      chain.push(SEARCH_RULES[i][1]);
      break;
    }
  }
  chain.push('美食');
  // 去重（保持顺序）
  var seen = {};
  return chain.filter(function(k) {
    if (seen[k]) return false;
    seen[k] = true;
    return true;
  });
}

// 智能搜索：沿关键词链逐级降级，保证尽量有结果
// 个人 Key 地点搜索仅 200 次/日，结果按「菜名+位置网格」缓存 12 小时省配额
// callback(list, usedKeyword, errMsg)：接口级报错立即中止降级并回传 errMsg
// cacheOnly=true 时只查缓存，未命中直接返回空（用于进页自动搜索，不烧配额）
var SEARCH_CACHE_KEY = 'nearby_search_cache';
var SEARCH_CACHE_TTL = 12 * 60 * 60 * 1000;
var SEARCH_CACHE_MAX = 30;

// 位置取小数点后 2 位（约 1km 网格），同一片区域共享缓存
function cacheKeyOf(name, latitude, longitude) {
  return name + '|' + latitude.toFixed(2) + ',' + longitude.toFixed(2);
}

function readSearchCache(key) {
  var cache = wx.getStorageSync(SEARCH_CACHE_KEY) || {};
  var hit = cache[key];
  if (hit && (Date.now() - hit.ts) < SEARCH_CACHE_TTL) return hit;
  return null;
}

function writeSearchCache(key, list, usedKeyword) {
  var cache = wx.getStorageSync(SEARCH_CACHE_KEY) || {};
  cache[key] = { list: list, usedKeyword: usedKeyword, ts: Date.now() };
  // 超量时清掉最旧的
  var keys = Object.keys(cache);
  if (keys.length > SEARCH_CACHE_MAX) {
    keys.sort(function(a, b) { return cache[a].ts - cache[b].ts; });
    delete cache[keys[0]];
  }
  wx.setStorage({ key: SEARCH_CACHE_KEY, data: cache });
}

function searchNearbySmart(name, latitude, longitude, callback, cacheOnly) {
  var key = cacheKeyOf(name, latitude, longitude);
  var hit = readSearchCache(key);
  if (hit) {
    logger.info('nearby', '命中搜索缓存「' + name + '」');
    callback(hit.list, hit.usedKeyword, null);
    return;
  }
  if (cacheOnly) {
    callback([], null, null);
    return;
  }
  var chain = buildKeywordChain(name);
  var tryIndex = function(i) {
    if (i >= chain.length) {
      // 「彻底没结果」也缓存，避免反复烧配额
      writeSearchCache(key, [], null);
      callback([], null, null);
      return;
    }
    searchNearby(chain[i], latitude, longitude, function(list, errMsg) {
      if (errMsg) {
        // Key 配额/权限类错误，换词无意义（不写缓存，明天恢复后可重试）
        callback([], null, errMsg);
      } else if (list.length > 0) {
        writeSearchCache(key, list, chain[i]);
        callback(list, chain[i], null);
      } else {
        tryIndex(i + 1);
      }
    });
  };
  tryIndex(0);
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
  searchNearbySmart: searchNearbySmart,
  formatDistance: formatDistance
};
