var foodsData = require('../../data/foods.js');
var randomUtil = require('../../utils/random.js');
var shareUtil = require('../../utils/share.js');

Page({
  data: {
    candidates: [],
    candidateCount: 4
  },

  onLoad: function() {
    this.generateCandidates();
  },

  // 生成候选菜品
  generateCandidates: function() {
    var candidates = randomUtil.getRandomMultiple(foodsData.foods, this.data.candidateCount);
    this.setData({ candidates: candidates });
  },

  // 替换单个候选
  replaceOne: function(e) {
    var index = e.currentTarget.dataset.index;
    var currentIds = this.data.candidates.map(function(f) { return f.id; });
    var newFood = randomUtil.getRandomExcluding(foodsData.foods, currentIds, 1);
    if (newFood) {
      var candidates = this.data.candidates.slice();
      candidates[index] = newFood;
      this.setData({ candidates: candidates });
    }
  },

  // 分享给同事
  onShareAppMessage: function() {
    var ids = this.data.candidates.map(function(f) { return f.id; });
    return {
      title: '帮我从这几个里选一个吧！',
      path: shareUtil.buildChooseSharePath(ids, '好友')
    };
  }
});
