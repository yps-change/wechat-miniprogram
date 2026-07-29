var foodsData = require('../../data/foods.js');
var shareUtil = require('../../utils/share.js');
var logger = require('../../utils/logger.js');
var subscribeUtil = require('../../utils/subscribe.js');

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
    recommenderName: '',
    submitted: false,
    sessionId: '',
    receivedFood: {},
    suggestions: [],
    isAuthor: false,
    added: false
  },

  onLoad: function(options) {
    var fromName = options.from ? decodeURIComponent(options.from) : '好友';
    var sessionId = options.sessionId ? decodeURIComponent(options.sessionId) : '';
    this.setData({ fromName: fromName, sessionId: sessionId });
    var mode = options.mode || 'choose';
    logger.info('help-choose', 'onLoad mode=' + mode + ' from=' + fromName + ' sessionId=' + (sessionId || '无'));
    var data = { mode: mode };
    if (options.ids) {
      var ids = shareUtil.parseIds(options.ids);
      data.candidates = shareUtil.getFoodsByIds(foodsData.foods, ids);
    }
    if (options.names) {
      var nameList = decodeURIComponent(options.names).split('|').filter(function(name) {
        return name;
      });
      // recommend 模式：菜单名仅作为快捷建议 chip；其他模式仍作为候选列表。
      if (mode === 'recommend') {
        data.suggestions = nameList;
      } else {
        data.candidates = nameList.map(function(name, index) {
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
    }
    if (options.recommend) {
      data.recommendationInput = decodeURIComponent(options.recommend);
    }
    if ((mode === 'menu' || mode === 'recommend') && !sessionId) {
      sessionId = createSessionId();
      data.sessionId = sessionId;
    }
    if (mode === 'recommend') {
      // 预填本机记住的昵称，好友无需每次重输
      data.recommenderName = wx.getStorageSync('my_nickname') || '';
    }
    this.setData(data);

    if (mode === 'received' && data.recommendationInput) {
      // 区分打开者身份：本机存过“我为该 session 做过推荐”的标记 => 我是推荐人本人
      var sid = this.data.sessionId;
      var iRecommended = sid ? wx.getStorageSync('my_recommendation_' + sid) : '';
      if (iRecommended) {
        logger.info('help-choose', '推荐人本人打开回传卡片');
        this.showAuthorView(data.recommendationInput);
      } else {
        logger.info('help-choose', '接收方打开，展示好友推荐，等待手动加入');
        this.prepareReceivedRecommendation(data.recommendationInput, fromName);
      }
    }
  },

  onRecommendationInput: function(e) {
    this.setData({ recommendationInput: e.detail.value, submitted: false });
  },

  // 点选建议 chip，快速填入推荐框
  onPickSuggestion: function(e) {
    var name = e.currentTarget.dataset.name;
    this.setData({ recommendationInput: name, submitted: false });
  },

  // 好友填写自己的昵称（type=nickname 聚焦时微信会自动带出微信昵称），
  // input / blur 两个事件都走这里，确保自动填充的值也能被捕获
  onRecommenderNameInput: function(e) {
    this.setData({ recommenderName: e.detail.value });
  },


  submitRecommendation: function() {
    var name = (this.data.recommendationInput || '').trim();
    if (!name) return;
    logger.info('help-choose', '提交推荐=' + name);
    // 本机记录“我为该 session 推荐了什么”，用于区分推荐人本人打开回传卡片
    var sid = this.data.sessionId;
    if (sid) {
      wx.setStorageSync('my_recommendation_' + sid, name);
    }
    // 记住昵称，方便好友下次推荐时自动带出
    var byName = (this.data.recommenderName || '').trim();
    if (byName) {
      wx.setStorageSync('my_nickname', byName);
    }
    this.setData({
      submitted: true,
      recommendationInput: name
    });
    wx.showToast({ title: '选好啦！记得发回给TA', icon: 'none' });
  },

  // 重新选：回到填写状态
  redoRecommendation: function() {
    this.setData({ submitted: false });
  },

  // 根据菜名解析菜品信息（库内匹配，否则给通用兜底）
  resolveFood: function(name) {
    return getFoodByName(name) || {
      name: name,
      emoji: '🍽️',
      categoryName: '好友推荐',
      priceRange: '自定',
      description: '这是好友为你推荐的美食，快去尝尝吧！'
    };
  },

  // 推荐人本人打开自己分享的回传卡片：只展示“我推荐了啥”，不入历史
  showAuthorView: function(name) {
    var food = this.resolveFood(name);
    this.setData({ receivedFood: food, isAuthor: true });
  },

  // 生成某条推荐在本次邀请中的去重键：同一 session 下按菜名区分，
  // 使得多位好友的不同推荐都能各自加入历史，且同一条推荐不会重复添加。
  receivedAddedKey: function(foodName) {
    var sessionId = this.data.sessionId || 'legacy';
    return 'received_recommendation_' + sessionId + '_' + foodName;
  },

  // 接收方打开：只展示好友推荐结果，是否已加入历史决定按钮文案，
  // 真正入历史需用户手动点击（见 addRecommendationToHistory）。
  prepareReceivedRecommendation: function(name, fromName) {
    var food = this.resolveFood(name);
    var alreadyAdded = !!wx.getStorageSync(this.receivedAddedKey(food.name));
    this.setData({ receivedFood: food, isAuthor: false, added: alreadyAdded });
  },

  // 手动把这条好友推荐加入历史，然后跳转到历史页查看。
  // 同一 session 支持多条不同推荐，重复点击/重复打开同一条不会重复入历史。
  addRecommendationToHistory: function() {
    var food = this.data.receivedFood;
    if (!food || !food.name) return;
    var addedKey = this.receivedAddedKey(food.name);

    // 加入历史的点击时机，顺带请求饭点提醒订阅
    subscribeUtil.requestMealReminder();

    if (!this.data.added && !wx.getStorageSync(addedKey)) {
      var history = wx.getStorageSync('food_history') || [];
      history.unshift({
        foodName: food.name,
        emoji: food.emoji,
        timestamp: Date.now(),
        source: 'friend_recommend',
        fromName: this.data.fromName
      });
      if (history.length > 50) history = history.slice(0, 50);
      wx.setStorageSync('food_history', history);
      wx.setStorageSync(addedKey, true);
      this.setData({ added: true });
      logger.info('help-choose', '手动加入历史=' + food.name);
    }

    wx.switchTab({ url: '/pages/history/history' });
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

  goToCoupons: function() {
    wx.navigateTo({ url: '/pages/coupons/coupons' });
  },

  onShareAppMessage: function() {
    var mode = this.data.mode;
    var selectedFood = this.data.chosenFood;

    // received：把好友推荐结果继续转发（保留原样式）
    if (mode === 'received') {
      var recvName = this.data.receivedFood.name;
      return {
        title: '😋 有人安利了「' + recvName + '」，你也来尝尝！',
        path: shareUtil.buildRecommendationSharePath(recvName, this.data.fromName, this.data.sessionId)
      };
    }

    // recommend：好友自由推荐后，回传推荐结果给发起人
    if (mode === 'recommend') {
      var recName = (this.data.recommendationInput || '').trim();
      // 带上好友昵称，让发起人知道是谁推荐的
      var byName = (this.data.recommenderName || '').trim() || '好友';
      return {
        title: recName ? '😋 我给你安利了「' + recName + '」，快去吃！' : '🍜 选择困难求助：帮我推荐一道好吃的呗！',
        path: recName
          ? shareUtil.buildRecommendationSharePath(recName, byName, this.data.sessionId)
          : shareUtil.buildRecommendSharePath(this.data.suggestions, this.data.sessionId)
      };
    }

    // choose/menu：从候选里选中后，回传推荐结果
    if (selectedFood) {
      return {
        title: '✅ 帮你拍板了：' + selectedFood.name + '，就它！',
        path: shareUtil.buildRecommendationSharePath(selectedFood.name, this.data.fromName, this.data.sessionId)
      };
    }

    // 未选中，继续作为邀请转发
    return {
      title: '🆘 选择困难求助：帮我从这几个里挑一个！',
      path: shareUtil.buildMenuSharePath(
        this.data.candidates.map(function(food) { return food.name; }),
        '好友', this.data.sessionId)
    };
  },

  // 朋友圈分享：单页模式以当前 query 打开本页
  onShareTimeline: function() {
    var mode = this.data.mode;
    // received：晒好友安利的结果，打开后还原同一张推荐卡片
    if (mode === 'received' && this.data.receivedFood.name) {
      return {
        title: '😋 好友安利了「' + this.data.receivedFood.name + '」，你也来试试！',
        query: 'mode=received&recommend=' + encodeURIComponent(this.data.receivedFood.name) +
          '&from=' + encodeURIComponent(this.data.fromName) +
          '&sessionId=' + encodeURIComponent(this.data.sessionId)
      };
    }
    // 其他模式：作为通用入口，打开后是自由推荐页
    return {
      title: '🍜 选择困难星人自救神器，今天吃什么一挑就定！',
      query: 'mode=recommend'
    };
  }
});
