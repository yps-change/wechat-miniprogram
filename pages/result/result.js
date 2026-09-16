var foodsData = require('../../data/foods.js');
var randomUtil = require('../../utils/random.js');
var logger = require('../../utils/logger.js');
var subscribeUtil = require('../../utils/subscribe.js');
var nearbyUtil = require('../../utils/nearby.js');
var foodPool = require('../../utils/food-pool.js');
var quipsUtil = require('../../utils/quips.js');

Page({
  data: {
    food: {},
    quip: '',
    tagNames: {
      spicy: '辣',
      mild: '清淡',
      heavy: '重口味',
      sweet: '偏甜',
      sour: '酸爽',
      fresh: '鲜美',
      custom: '专属'
    },
    // 附近餐馆（Key 已在 utils/nearby.js 配置，onLoad 时按 isEnabled() 置为 true）
    nearbyEnabled: false,
    nearbyLoading: false,
    nearbyList: [],
    nearbyNote: '',
    markers: [],
    includePoints: [],
    mapLatitude: 0,
    mapLongitude: 0
  },

  onLoad: function(options) {
    this.setData({ nearbyEnabled: nearbyUtil.isEnabled() });
    var food = null;
    if (options.id) {
      // 默认菜库菜品
      var id = parseInt(options.id, 10);
      food = foodsData.foods.find(function(f) {
        return f.id === id;
      });
    } else if (options.name) {
      // 专属菜单菜品（转盘传 name 进来）
      food = foodPool.normalizeCustomFood(decodeURIComponent(options.name), 0);
    }
    if (food) {
      this.setData({ food: food, quip: quipsUtil.getQuip() });
      this.autoSearchNearby();
    }
  },

  // 确认选择
  onConfirm: function() {
    var food = this.data.food;
    if (!food || !food.id) return;
    logger.info('result', '确认选择并写入历史=' + food.name);

    // 确认时机请求饭点提醒订阅（必须处于点击调用链中）
    subscribeUtil.requestMealReminder();

    var history = wx.getStorageSync('food_history') || [];
    history.unshift({
      foodId: food.id,
      foodName: food.name,
      emoji: food.emoji,
      timestamp: Date.now(),
      source: food.isCustom ? 'custom' : 'self'
    });
    if (history.length > 50) {
      history = history.slice(0, 50);
    }
    wx.setStorageSync('food_history', history);

    wx.showToast({
      title: '就这么定了：' + food.name + ' 🍽️',
      icon: 'none',
      duration: 1500
    });

    // 定完顺路去领外卖券，正好点单用
    setTimeout(function() {
      wx.redirectTo({ url: '/pages/coupons/coupons' });
    }, 1500);
  },

  // 换一个（与转盘同池随机，刷新本页）
  onAgain: function() {
    var food = randomUtil.getRandomOne(foodPool.getPool());
    if (!food) return;
    this.setData({ food: food, quip: quipsUtil.getQuip() });
    // 新菜名重新搜附近
    this.autoSearchNearby();
  },

  // ========== 附近餐馆 ==========

  // 进页/换菜时静默尝试：只查缓存不发请求（省每日 200 次配额），没缓存就等用户点按钮
  autoSearchNearby: function() {
    if (!this.data.nearbyEnabled) return;
    var loc = nearbyUtil.getCachedLocation();
    if (loc) {
      this.doSearchNearby(loc, true);
    } else {
      // 清掉上一道菜的旧结果
      this.setData({ nearbyList: [], markers: [] });
    }
  },

  // 「看看附近哪家店」按钮：无缓存位置时先让用户在地图上确认位置
  findNearby: function() {
    var that = this;
    var loc = nearbyUtil.getCachedLocation();
    if (loc) {
      this.doSearchNearby(loc, false);
      return;
    }
    nearbyUtil.chooseLocation(function(picked) {
      if (picked) that.doSearchNearby(picked, false);
    });
  },

  doSearchNearby: function(loc, cacheOnly) {
    var that = this;
    var keyword = this.data.food.name;
    if (!keyword) return;
    this.setData({ nearbyLoading: !cacheOnly, nearbyList: [], markers: [], nearbyNote: '' });

    // 智能降级搜索：原菜名→品类词→美食，结果缓存 12 小时
    nearbyUtil.searchNearbySmart(keyword, loc.latitude, loc.longitude, function(list, usedKeyword, errMsg) {
      if (list.length === 0) {
        that.setData({ nearbyLoading: false });
        if (cacheOnly) return; // 静默模式无缓存：保留按钮等用户手动搜
        if (errMsg) {
          // 接口暂时不可用（多为每日免费配额用尽），给用户友好提示
          var friendly = errMsg.indexOf('(121)') !== -1
            ? '今天查附近的人太多啦，明天再来试试吧'
            : '附近搜索暂时不可用，请稍后再试';
          wx.showToast({ title: friendly, icon: 'none', duration: 2500 });
        } else {
          wx.showToast({ title: '附近实在没找到吃的 😅', icon: 'none' });
        }
        return;
      }
      // 降级命中时提示用的是什么词
      var note = usedKeyword !== keyword
        ? '附近暂无「' + keyword + '」，按「' + usedKeyword + '」为你找了这些：'
        : '';
      // 由近及远的列表（接口已按距离升序返回）
      var nearbyList = list.map(function(item, index) {
        return {
          rank: index + 1,
          title: item.title,
          address: item.address,
          distanceText: nearbyUtil.formatDistance(item._distance),
          latitude: item.location.lat,
          longitude: item.location.lng
        };
      });
      // 地图标注：气泡常显「序号+距离」，一眼看出远近
      var markers = list.map(function(item, index) {
        return {
          id: index,
          latitude: item.location.lat,
          longitude: item.location.lng,
          iconPath: '/images/marker_food.png',
          width: 28,
          height: 35,
          callout: {
            content: (index + 1) + '.' + item.title.slice(0, 8) + ' ' + nearbyUtil.formatDistance(item._distance),
            fontSize: 11,
            borderRadius: 8,
            padding: 5,
            display: 'ALWAYS'
          }
        };
      });
      // 视野自动包含我的位置和所有店铺
      var includePoints = list.map(function(item) {
        return { latitude: item.location.lat, longitude: item.location.lng };
      });
      includePoints.push({ latitude: loc.latitude, longitude: loc.longitude });
      that.setData({
        nearbyLoading: false,
        nearbyList: nearbyList,
        nearbyNote: note,
        markers: markers,
        includePoints: includePoints,
        mapLatitude: loc.latitude,
        mapLongitude: loc.longitude
      });
    }, cacheOnly);
  },

  // 点列表某一家：打开微信内置地图，可一键导航过去
  onShopTap: function(e) {
    var index = e.currentTarget.dataset.index;
    var shop = this.data.nearbyList[index];
    if (!shop) return;
    wx.openLocation({
      latitude: shop.latitude,
      longitude: shop.longitude,
      name: shop.title,
      address: shop.address,
      scale: 16
    });
  },

  // 返回首页
  goBack: function() {
    wx.navigateBack();
  },

  // 分享还原参数：默认菜品用 id，专属菜品用 name
  buildShareQuery: function() {
    var food = this.data.food;
    if (!food || !food.id) return '';
    return food.isCustom
      ? 'name=' + encodeURIComponent(food.name)
      : 'id=' + food.id;
  },

  // 好友分享：炫耀式标题晒结果，好友打开还原同一道菜
  // 若由「测默契」按钮发起，则邀请好友玩双人饭缘默契测试
  onShareAppMessage: function(res) {
    var food = this.data.food;
    if (res && res.from === 'button' && res.target && res.target.dataset.type === 'match' && food.name) {
      return {
        title: '🤝 敢不敢测测我俩今天吃饭的默契？',
        path: '/pages/match/match?food=' + encodeURIComponent(food.name) +
          '&emoji=' + encodeURIComponent(food.emoji || '')
      };
    }
    var query = this.buildShareQuery();
    return {
      title: quipsUtil.getBoastTitle(food.name),
      path: query ? '/pages/result/result?' + query : '/pages/index/index'
    };
  },

  // 朋友圈分享：单页模式带参还原结果页
  onShareTimeline: function() {
    return {
      title: quipsUtil.getBoastTitle(this.data.food.name),
      query: this.buildShareQuery()
    };
  }
});
