var foodsData = require('../../data/foods.js');
var shareUtil = require('../../utils/share.js');

Page({
  data: {
    fromName: '好友',
    candidates: [],
    chosen: null,
    chosenFood: null
  },

  onLoad: function(options) {
    if (options.from) {
      this.setData({ fromName: decodeURIComponent(options.from) });
    }
    if (options.ids) {
      var ids = shareUtil.parseIds(options.ids);
      var candidates = shareUtil.getFoodsByIds(foodsData.foods, ids);
      this.setData({ candidates: candidates });
    }
  },

  onChoose: function(e) {
    var id = e.currentTarget.dataset.id;
    var food = this.data.candidates.find(function(f) {
      return f.id === id;
    });
    this.setData({
      chosen: id,
      chosenFood: food
    });
  },

  goToIndex: function() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  onShareAppMessage: function() {
    return {
      title: '今天吃什么？来随机一个！',
      path: '/pages/index/index'
    };
  }
});
