var couponConfig = require('../../../utils/coupon-config.js');

Page({
  data: {
    platform: {},
    coupon: {},
    copyText: ''
  },

  onLoad: function(options) {
    var platformIndex = Number(options.platformIndex);
    var couponIndex = Number(options.couponIndex);
    var platform = couponConfig.platforms[platformIndex];
    var coupon = platform && platform.coupons[couponIndex];
    if (!platform || !coupon) {
      wx.showToast({ title: '优惠券不存在', icon: 'none' });
      return;
    }
    this.setData({
      platform: platform,
      coupon: coupon,
      copyText: coupon.copyText || coupon.url || ''
    });
  },

  copyCode: function() {
    var platform = this.data.platform;
    var coupon = this.data.coupon;
    var copyText = this.data.copyText;
    if (!copyText) {
      wx.showToast({ title: '暂无可复制口令', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: copyText,
      success: function() {
        wx.showModal({
          title: '口令已复制',
          content: '现在打开' + (coupon.appName || platform.name) + '，粘贴到搜索框，App 会自动识别并弹出红包。',
          showCancel: false,
          confirmText: '知道了'
        });
      },
      fail: function() {
        wx.showToast({ title: '复制失败，请重试', icon: 'none' });
      }
    });
  }
});