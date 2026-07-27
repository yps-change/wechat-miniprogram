var foodsData = require('../../data/foods.js');
var randomUtil = require('../../utils/random.js');

Page({
  data: {
    fromName: '好友',
    currentFood: {},
    isFlipped: false,
    shaking: false
  },

  onLoad: function(options) {
    if (options.from) {
      this.setData({ fromName: decodeURIComponent(options.from) });
    }
  },

  onRandomPick: function() {
    var that = this;

    if (this.data.isFlipped) {
      this.setData({ isFlipped: false });
      setTimeout(function() {
        that._doRandomPick();
      }, 300);
    } else {
      this._doRandomPick();
    }
  },

  _doRandomPick: function() {
    var that = this;
    this.setData({ shaking: true });

    setTimeout(function() {
      var food = randomUtil.getRandomOne(foodsData.foods);
      that.setData({
        currentFood: food,
        isFlipped: true,
        shaking: false
      });
    }, 500);
  },

  goToIndex: function() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  onShareAppMessage: function() {
    return {
      title: '今天吃什么？来随机一个！',
      path: '/pages/index/index'
    };
  },

  // 朋友圈分享：单页模式打开本页，不带参数也可直接摇
  onShareTimeline: function() {
    return {
      title: '🎲 今天吃什么？摇一下就知道！'
    };
  }
});
