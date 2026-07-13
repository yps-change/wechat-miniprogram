var foodsData = require('../../data/foods.js');
var shareUtil = require('../../utils/share.js');

Page({
  data: {
    fromName: '好友',
    candidates: [],
    chosen: null,
    chosenFood: null,
    mode: 'choose',
    recommendationInput: '',
    submitted: false
  },

  onLoad: function(options) {
    if (options.from) {
      this.setData({ fromName: decodeURIComponent(options.from) });
    }
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
          categoryName: '同事推荐菜单',
          priceRange: '自定',
          emoji: '🍽️'
        };
      });
    }
    if (options.recommend) {
      data.recommendationInput = decodeURIComponent(options.recommend);
    }
    this.setData(data);
  },

  onRecommendationInput: function(e) {
    this.setData({ recommendationInput: e.detail.value });
  },

  submitRecommendation: function() {
    var name = (this.data.recommendationInput || '').trim();
    if (!name) return;
    wx.setStorageSync('colleague_recommendation', {
      foodName: name,
      fromName: this.data.fromName,
      timestamp: Date.now()
    });
    this.setData({ submitted: true });
    wx.showToast({ title: '推荐已发回', icon: 'success' });
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
    var title = hasRecommendation
      ? '我推荐你吃：' + this.data.recommendationInput
      : '帮我推荐一道你喜欢吃的！';
    return {
      title: title,
      path: hasRecommendation
        ? shareUtil.buildRecommendationSharePath(this.data.recommendationInput, this.data.fromName)
        : shareUtil.buildMenuSharePath(this.data.candidates.map(function(food) { return food.name; }), '好友')
    };
  }
});
