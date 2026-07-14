var couponConfig = require('../../utils/coupon-config.js');

Page({
  data: {
    platforms: []
  },

  onLoad: function() {
    this.setData({ platforms: couponConfig.platforms });
  },

  copyCoupon: function(e) {
    var platformIndex = e.currentTarget.dataset.platformIndex;
    var couponIndex = e.currentTarget.dataset.couponIndex;
    var platform = this.data.platforms[platformIndex];
    var coupon = platform && platform.coupons[couponIndex];
    if (!coupon || !coupon.url) return;

    wx.setClipboardData({
      data: coupon.url,
      success: function() {
        wx.showToast({ title: '链接已复制', icon: 'success' });
      }
    });
  }
});
