var foodsData = require('../../data/foods.js');
var randomUtil = require('../../utils/random.js');
var logger = require('../../utils/logger.js');
var subscribeUtil = require('../../utils/subscribe.js');
var nearbyUtil = require('../../utils/nearby.js');
var foodPool = require('../../utils/food-pool.js');

Page({
  data: {
    food: {},
    tagNames: {
      spicy: '辣',
      mild: '清淡',
      heavy: '重口味',
      sweet: '偏甜',
      sour: '酸爽',
      fresh: '鲜美',
      custom: '专属'
    },
    // 附近餐馆（需配置腾讯位置服务 Key 后启用）
    nearbyEnabled: false,
    nearbyLoading: false,
    nearbyShop: null,
    markers: [],
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
      this.setData({ food: food });
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
      duration: 2000
    });

    setTimeout(function() {
      wx.switchTab({ url: '/pages/index/index' });
    }, 1500);
  },

  // 换一个（与转盘同池随机，刷新本页）
  onAgain: function() {
    var food = randomUtil.getRandomOne(foodPool.getPool());
    if (!food) return;
    this.setData({ food: food });
    // 新菜名重新搜附近
    this.autoSearchNearby();
  },

  // ========== 附近餐馆 ==========

  // 有缓存位置时静默自动搜索；没有则等用户点按钮
  autoSearchNearby: function() {
    if (!this.data.nearbyEnabled) return;
    var loc = nearbyUtil.getCachedLocation();
    if (loc) {
      this.doSearchNearby(loc);
    } else {
      // 清掉上一道菜的旧结果
      this.setData({ nearbyShop: null, markers: [] });
    }
  },

  // 「看看附近哪家店」按钮：无缓存位置时先让用户在地图上确认位置
  findNearby: function() {
    var that = this;
    var loc = nearbyUtil.getCachedLocation();
    if (loc) {
      this.doSearchNearby(loc);
      return;
    }
    nearbyUtil.chooseLocation(function(picked) {
      if (picked) that.doSearchNearby(picked);
    });
  },

  doSearchNearby: function(loc) {
    var that = this;
    var keyword = this.data.food.name;
    if (!keyword) return;
    this.setData({ nearbyLoading: true, nearbyShop: null, markers: [] });

    nearbyUtil.searchNearby(keyword, loc.latitude, loc.longitude, function(list) {
      if (list.length === 0) {
        that.setData({ nearbyLoading: false });
        wx.showToast({ title: '附近没搜到「' + keyword + '」', icon: 'none' });
        return;
      }
      var nearest = list[0];
      // 最多标 5 家，最近一家常显气泡
      var markers = list.map(function(item, index) {
        return {
          id: index,
          latitude: item.location.lat,
          longitude: item.location.lng,
          iconPath: '/images/marker_food.png',
          width: 28,
          height: 35,
          callout: {
            content: item.title + '  ' + nearbyUtil.formatDistance(item._distance),
            fontSize: 12,
            borderRadius: 8,
            padding: 6,
            display: index === 0 ? 'ALWAYS' : 'BYCLICK'
          }
        };
      });
      that.setData({
        nearbyLoading: false,
        nearbyShop: {
          title: nearest.title,
          address: nearest.address,
          distanceText: nearbyUtil.formatDistance(nearest._distance),
          latitude: nearest.location.lat,
          longitude: nearest.location.lng
        },
        markers: markers,
        mapLatitude: nearest.location.lat,
        mapLongitude: nearest.location.lng
      });
    });
  },

  // 点卡片/导航按钮：打开微信内置地图，可一键导航过去
  openNavigation: function() {
    var shop = this.data.nearbyShop;
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

  // 好友分享：晒抽签结果，好友打开还原同一道菜
  onShareAppMessage: function() {
    var food = this.data.food;
    var query = this.buildShareQuery();
    return {
      title: food.name ? '🎉 今天就吃「' + food.name + '」！你也来抽一个？' : '今天吃什么？来抽一个！',
      path: query ? '/pages/result/result?' + query : '/pages/index/index'
    };
  },

  // 朋友圈分享：单页模式带参还原结果页
  onShareTimeline: function() {
    var food = this.data.food;
    return {
      title: food.name ? '🎉 今天就吃「' + food.name + '」！你也来抽一个？' : '🎯 今天吃什么？抽一个！',
      query: this.buildShareQuery()
    };
  }
});
