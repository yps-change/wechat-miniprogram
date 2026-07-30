/**
 * 饭缘默契测试：双人转盘测默契（纯前端，无需后端）
 *
 * 链路：A 在结果页点「测默契」分享 → B 打开本页看到 A 转到的菜 →
 * B 也转一个 → 按两道菜的接近程度算默契度 → B 把结果回传给 A（mode=result，
 * A 直接看到双方的菜和分数）→ A 可「再来一回合」继续比，形成来回互动链。
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
    resultView: false,   // 打开的是对方回传的结果卡片（看结果视角）
    invalid: false       // 无邀请参数（如从朋友圈单页进入）
  },

  onLoad: function(options) {
    // 结果回传卡片：直接展示双方的菜和默契分，不用再转
    if (options.mode === 'result' && options.f1 && options.f2) {
      var score = parseInt(options.score, 10) || 0;
      this.setData({
        inviterFood: {
          name: decodeURIComponent(options.f1),
          emoji: options.e1 ? decodeURIComponent(options.e1) : '🍽️'
        },
        myFood: {
          name: decodeURIComponent(options.f2),
          emoji: options.e2 ? decodeURIComponent(options.e2) : '🍽️'
        },
        score: score,
        level: this.levelForScore(score),
        tested: true,
        resultView: true
      });
      return;
    }
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
    return { score: score, level: this.levelForScore(score) };
  },

  // 分数 => 默契等级文案（回传卡片只带分数，打开时由此反推）
  levelForScore: function(score) {
    if (score >= 100) return '灵魂饭友！连老天爷都让你俩吃一样的';
    if (score >= 70) return '口味相投，今天可以拼一单';
    if (score >= 40) return '还算合拍，各点各的也能吃到一块去';
    return '互补型饭友，一起点单永远不抢菜';
  },

  // 按菜名在默认菜库里找（专属菜名可能找不到，返回 null）
  findInLibrary: function(name) {
    return foodsData.foods.find(function(f) { return f.name === name; }) || null;
  },

  // 再测一次
  onRetry: function() {
    this.setData({ tested: false, myFood: null, score: 0, level: '' });
  },

  // 再来一回合：拿对方刚转到的菜当新邀请，自己也转一个继续比
  onRematch: function() {
    this.setData({
      inviterFood: this.data.myFood,
      myFood: null,
      tested: false,
      resultView: false,
      score: 0,
      level: ''
    });
  },

  goToIndex: function() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  goToCoupons: function() {
    wx.navigateTo({ url: '/pages/coupons/coupons' });
  },

  // 分享：出结果后把双方的菜+分数一起回传（mode=result），对方打开直接看到结果
  onShareAppMessage: function() {
    var d = this.data;
    if (d.tested && d.myFood) {
      return {
        title: d.resultView
          ? '🤝 我俩的饭缘默契 ' + d.score + '%！你们也来测测'
          : '🤝 我和' + d.fromName + '的饭缘默契 ' + d.score + '%！快看看我抽到了啥',
        path: '/pages/match/match?mode=result' +
          '&f1=' + encodeURIComponent(d.inviterFood.name) +
          '&e1=' + encodeURIComponent(d.inviterFood.emoji) +
          '&f2=' + encodeURIComponent(d.myFood.name) +
          '&e2=' + encodeURIComponent(d.myFood.emoji) +
          '&score=' + d.score
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
