var couponConfig = require('../../utils/coupon-config.js');

Page({
  data: {
    platforms: []
  },

  onLoad: function() {
    this.setData({ platforms: couponConfig.platforms });
  },

  openCouponDetail: function(e) {
    var platformIndex = e.currentTarget.dataset.platformIndex;
    var couponIndex = e.currentTarget.dataset.couponIndex;
    wx.navigateTo({
      url: '/pages/coupons/coupon-detail/coupon-detail?platformIndex=' +
        platformIndex + '&couponIndex=' + couponIndex
    });
  },

  // 好友分享：红包页是高分享意愿场景
  onShareAppMessage: function() {
    return {
      title: '🧧 外卖红包天天领，点外卖前先来薅一把！',
      path: '/pages/coupons/coupons'
    };
  },

  // 朋友圈分享：单页模式打开本页即可浏览红包列表
  onShareTimeline: function() {
    return {
      title: '🧧 外卖红包天天领，点外卖前先来薅一把！'
    };
  }
});
