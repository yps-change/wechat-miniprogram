var couponConfig = require('../../utils/coupon-config.js');

Page({
  data: {
    platforms: []
  },

  onLoad: function() {
    this.setData({ platforms: couponConfig.platforms });
  },

  openCoupon: function(e) {
    var platformIndex = e.currentTarget.dataset.platformIndex;
    var couponIndex = e.currentTarget.dataset.couponIndex;
    var platform = this.data.platforms[platformIndex];
    var coupon = platform && platform.coupons[couponIndex];
    if (!coupon || !coupon.url) return;

    // wx.openUrl 不是所有基础库都提供，优先尝试直达，失败后复制链接兜底。
    if (/^https?:\/\//.test(coupon.url) && typeof wx.openUrl === 'function') {
      wx.openUrl({
        url: coupon.url,
        fail: function() {
          this.copyCouponUrl(coupon.url);
        }.bind(this)
      });
      return;
    }

    this.copyCouponUrl(coupon.url);
  },

  copyCouponUrl: function(url) {
    wx.setClipboardData({
      data: url,
      success: function() {
        wx.showModal({
          title: '链接已复制',
          content: '请粘贴到微信或浏览器中打开领取。',
          showCancel: false,
          confirmText: '知道了'
        });
      }
    });
  }
});
