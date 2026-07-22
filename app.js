var logger = require('./utils/logger.js');

App({
  onLaunch: function() {
    // 小程序启动
    logger.info('app', 'onLaunch 小程序启动');
  },

  onShow: function() {
    logger.info('app', 'onShow 小程序进入前台');
  },

  onHide: function() {
    logger.info('app', 'onHide 小程序退到后台');
  },

  // 全局错误兜底：任何页面未捕获的异常都会到这里，方便定位线上问题
  onError: function(err) {
    logger.error('app', '全局错误', err);
  },

  globalData: {
    userInfo: null
  }
});
App({
  onLaunch: function() {
    // 小程序启动
  },

  globalData: {
    userInfo: null
  }
});
