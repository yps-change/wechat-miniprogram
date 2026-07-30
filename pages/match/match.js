/**
 * 饭缘默契测试：双人转盘测默契（纯前端，无需后端）
 *
 * 链路：A 在结果页点「测默契」分享 → B 打开本页看到 A 转到的菜 →
 * B 也转一个 → 按两道菜的接近程度算默契度 → B 把结果发回/再邀请别人，形成裂变链。
 */
var foodsData = require('../../data/foods.js');
var randomUtil = require('../../utils/random.js');
var foodPool = require('../../utils/food-pool.js');
var logger = require('../../utils/logger.js');

Page({
  data: {
    fromName: '好友',
    inviterFood: null,   // TA 转到的菜 { name, emoji }
    myFood: null,        // 我转到的菜
    tested: false,       // 是否已出结果
    score: 0,            // 默契度 0-100
    level: '',           // 默契等级文案
    shaking: false,      // 转的动效
    invalid: false       // 无邀请参数（如从朋友圈单页进入）
  },

  onLoad: function(options) {
    if (options.food) {
      var name = decodeURIComponent(options.food);
      this.setData({
        inviterFood: {
          name: name,
          emoji: options.emoji ? decodeURIComponent(options.emoji) : '🍽️'
        },
        fromName: options.from ? decodeURIComponent(options.from) : '好友'
      });
    } else {
      this.setData({ invalid: true });
    }
  },

  // 我也转一个：随机抽菜 + 算默契度
  onSpin: function() {
    var that = this;
    if (this.data.shaking) return;
    this.setData({ shaking: true });
    var myFood = randomUtil.getRandomOne(foodPool.getPool()) ||
      randomUtil.getRandomOne(foodsData.foods);
    // 留个短动效时间，仪式感
    setTimeout(function() {
      var result = that.calcMatch(that.data.inviterFood, myFood);
      logger.info('match', '默契结果 ' + result.score + '%');
      that.setData({
        shaking: false,
        myFood: { name: myFood.name, emoji: myFood.emoji || '🍽️' },
        tested: true,
        score: result.score,
        level: result.level
      });
    }, 600);
  },

  // 默契度规则：同一道菜=100；同品类=70-89；其他=20-59
  calcMatch: function(inviterFood, myFood) {
    var score;
    if (inviterFood.name === myFood.name) {
      score = 100;
    } else {
      var inviterLib = this.findInLibrary(inviterFood.name);
      var sameCategory = inviterLib && myFood.category &&
        inviterLib.category === myFood.category;
      score = sameCategory
        ? 70 + Math.floor(Math.random() * 20)
        : 20 + Math.floor(Math.random() * 40);
    }
    var level;
    if (score >= 100) level = '灵魂饭友！连老天爷都让你俩吃一样的';
    else if (score >= 70) level = '口味相投，今天可以拼一单';
    else if (score >= 40) level = '还算合拍，各点各的也能吃到一块去';
    else level = '互补型饭友，一起点单永远不抢菜';
    return { score: score, level: level };
  },

  // 按菜名在默认菜库里找（专属菜名可能找不到，返回 null）
  findInLibrary: function(name) {
    return foodsData.foods.find(function(f) { return f.name === name; }) || null;
  },

  // 再测一次
  onRetry: function() {
    this.setData({ tested: false, myFood: null, score: 0, level: '' });
  },

  goToIndex: function() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  // 分享：出结果后晒默契度并把"我的菜"作为新邀请，裂变链继续
  onShareAppMessage: function() {
    var d = this.data;
    if (d.tested && d.myFood) {
      return {
        title: '🤝 我和' + d.fromName + '的饭缘默契 ' + d.score + '%！你也来和我测一测',
        path: '/pages/match/match?food=' + encodeURIComponent(d.myFood.name) +
          '&emoji=' + encodeURIComponent(d.myFood.emoji)
      };
    }
    return {
      title: '🤝 敢不敢测测我俩今天吃饭的默契？',
      path: d.inviterFood
        ? '/pages/match/match?food=' + encodeURIComponent(d.inviterFood.name) +
          '&emoji=' + encodeURIComponent(d.inviterFood.emoji)
        : '/pages/index/index'
    };
  },

  onShareTimeline: function() {
    return { title: '🤝 饭缘默契测试：测测你和TA今天吃饭有多默契' };
  }
});
