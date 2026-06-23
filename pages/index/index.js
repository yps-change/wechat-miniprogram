var foodsData = require('../../data/foods.js');
var randomUtil = require('../../utils/random.js');
var shareUtil = require('../../utils/share.js');

Page({
  data: {
    currentFood: {},
    isFlipped: false,
    shaking: false
  },

  onLoad: function() {
    // 页面加载
  },

  // 随机推荐
  onRandomPick: function() {
    var that = this;

    // 如果已经翻开了，先重置卡片再翻新的
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
    // 触发摇晃动画
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

  // 确认选择，存入历史
  onConfirm: function() {
    var food = this.data.currentFood;
    if (!food || !food.id) return;

    // 存入本地历史
    var history = wx.getStorageSync('food_history') || [];
    history.unshift({
      foodId: food.id,
      foodName: food.name,
      emoji: food.emoji,
      timestamp: Date.now(),
      source: 'self'
    });
    // 最多保留50条
    if (history.length > 50) {
      history = history.slice(0, 50);
    }
    wx.setStorageSync('food_history', history);

    wx.showToast({
      title: '今天就吃' + food.name + '！',
      icon: 'none',
      duration: 2000
    });
  },

  // 跳转到候选页
  goToCandidates: function() {
    wx.navigateTo({
      url: '/pages/candidates/candidates'
    });
  },

  // 分享给好友
  onShareAppMessage: function(res) {
    return {
      title: '我选不了了，帮我随机抽一个今天吃什么！',
      path: shareUtil.buildRandomSharePath('好友')
    };
  }
});
