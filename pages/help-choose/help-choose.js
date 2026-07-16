var foodsData = require('../../data/foods.js');
var shareUtil = require('../../utils/share.js');

function createSessionId() {
  return Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
}

function getFoodByName(name) {
  return foodsData.foods.find(function(food) {
    return food.name === name;
  });
}

Page({
  data: {
    fromName: '好友',
    candidates: [],
    chosen: null,
    chosenFood: null,
    mode: 'choose',
    recommendationInput: '',
    submitted: false,
    sessionId: '',
    receivedFood: {}
  },

  onLoad: function(options) {
    var fromName = options.from ? decodeURIComponent(options.from) : '好友';
    var sessionId = options.sessionId ? decodeURIComponent(options.sessionId) : '';
    this.setData({ fromName: fromName, sessionId: sessionId });
    var mode = options.mode || 'choose';
    var data = { mode: mode };
    if (options.ids) {
      var ids = shareUtil.parseIds(options.ids);
      data.candidates = shareUtil.getFoodsByIds(foodsData.foods, ids);
    }
    if (options.names) {
      data.candidates = decodeURIComponent(options.names).split('|').filter(function(name) {
        return name;
      }).map(function(name, index) {
        return {
          id: 'shared_' + index,
          name: name,
          categoryName: '好友推荐菜单',
          priceRange: '自定',
          emoji: '🍽️',
          description: '好友邀请你从专属菜单中选择的美食。'
        };
      });
    }
    if (options.recommend) {
      data.recommendationInput = decodeURIComponent(options.recommend);
    }
    if (mode === 'menu' && !sessionId) {
      sessionId = createSessionId();
      data.sessionId = sessionId;
    }
    this.setData(data);

    if (mode === 'received' && data.recommendationInput) {
      this.receiveRecommendation(data.recommendationInput, fromName);
    }
  },

  onRecommendationInput: function(e) {
    this.setData({ recommendationInput: e.detail.value });
  },

  submitRecommendation: function() {
    var name = (this.data.recommendationInput || '').trim();
    if (!name) return;
    this.setData({
      submitted: true,
      recommendationInput: name
    });
    wx.showToast({ title: '请点击分享结果发回', icon: 'none' });
  },

  receiveRecommendation: function(name, fromName) {
    var food = getFoodByName(name) || {
      name: name,
      emoji: '🍽️',
      categoryName: '好友推荐',
      priceRange: '自定',
      description: '这是好友为你推荐的美食，快去尝尝吧！'
    };
    this.setData({ receivedFood: food });
    var sessionId = this.data.sessionId || 'legacy';
    var receiveKey = 'received_recommendation_' + sessionId;
    if (wx.getStorageSync(receiveKey)) return;
    wx.setStorageSync(receiveKey, true);

    var timestamp = Date.now();
    var history = wx.getStorageSync('food_history') || [];
    history.unshift({
      foodName: food.name,
      emoji: food.emoji,
      timestamp: timestamp,
      source: 'friend_recommend',
      fromName: fromName
    });
    if (history.length > 50) history = history.slice(0, 50);
    wx.setStorageSync('food_history', history);
    wx.setStorageSync('pending_friend_recommendation', {
      foodName: food.name,
      fromName: fromName,
      timestamp: timestamp
    });

    wx.showModal({
      title: '收到好友推荐',
      content: fromName + '已完成推荐，推荐了“' + name + '”。已将它加入历史记录。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  onChoose: function(e) {
    var id = e.currentTarget.dataset.id;
    var food = this.data.candidates.find(function(f) {
      return f.id === id;
    });
    this.setData({
      chosen: id,
      chosenFood: food,
      recommendationInput: food ? food.name : ''
    });
  },

  goToIndex: function() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  onShareAppMessage: function() {
    var hasRecommendation = !!this.data.recommendationInput;
    var isReceived = this.data.mode === 'received';
    var foodName = isReceived ? this.data.receivedFood.name : this.data.recommendationInput;
    var title = isReceived
      ? '好友帮你推荐了：' + foodName
      : (hasRecommendation ? '我推荐你吃：' + foodName : '帮我推荐一道你喜欢吃的！');
    return {
      title: title,
      path: isReceived || hasRecommendation
        ? shareUtil.buildRecommendationSharePath(foodName, this.data.fromName, this.data.sessionId)
        : shareUtil.buildMenuSharePath(this.data.candidates.map(function(food) { return food.name; }), '好友', this.data.sessionId)
    };
  }
});
