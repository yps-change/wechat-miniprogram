var foodsData = require('../../data/foods.js');

Page({
  data: {
    food: {},
    tagNames: {
      spicy: '辣',
      mild: '清淡',
      heavy: '重口味',
      sweet: '偏甜',
      sour: '酸爽',
      fresh: '鲜美'
    }
  },

  onLoad: function(options) {
    if (options.id) {
      var id = parseInt(options.id, 10);
      var food = foodsData.foods.find(function(f) {
        return f.id === id;
      });
      if (food) {
        this.setData({ food: food });
      }
    }
  },

  onConfirm: function() {
    var food = this.data.food;
    if (!food || !food.id) return;

    var history = wx.getStorageSync('food_history') || [];
    history.unshift({
      foodId: food.id,
      foodName: food.name,
      emoji: food.emoji,
      timestamp: Date.now(),
      source: 'self'
    });
    if (history.length > 50) {
      history = history.slice(0, 50);
    }
    wx.setStorageSync('food_history', history);

    wx.showToast({
      title: '今天就吃' + food.name + '！',
      icon: 'none'
    });

    setTimeout(function() {
      wx.switchTab({ url: '/pages/index/index' });
    }, 1500);
  },

  goBack: function() {
    wx.navigateBack();
  }
});
