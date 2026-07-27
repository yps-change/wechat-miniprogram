var foodsData = require('../../data/foods.js');
var randomUtil = require('../../utils/random.js');
var logger = require('../../utils/logger.js');

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

  // 确认选择
  onConfirm: function() {
    var food = this.data.food;
    if (!food || !food.id) return;
    logger.info('result', '确认选择并写入历史=' + food.name);

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
      title: '就这么定了：' + food.name + ' 🍽️',
      icon: 'none',
      duration: 2000
    });

    setTimeout(function() {
      wx.switchTab({ url: '/pages/index/index' });
    }, 1500);
  },

  // 换一个（随机新菜品刷新本页）
  onAgain: function() {
    var food = randomUtil.getRandomOne(foodsData.foods);
    this.setData({ food: food });
  },

  // 返回首页
  goBack: function() {
    wx.navigateBack();
  },

  // 好友分享：晒抽签结果，好友打开还原同一道菜
  onShareAppMessage: function() {
    var food = this.data.food;
    return {
      title: food.name ? '🎉 今天就吃「' + food.name + '」！你也来抽一个？' : '今天吃什么？来抽一个！',
      path: food.id ? '/pages/result/result?id=' + food.id : '/pages/index/index'
    };
  },

  // 朋友圈分享：单页模式带 id 还原结果页
  onShareTimeline: function() {
    var food = this.data.food;
    return {
      title: food.name ? '🎉 今天就吃「' + food.name + '」！你也来抽一个？' : '🎯 今天吃什么？抽一个！',
      query: food.id ? 'id=' + food.id : ''
    };
  }
});
