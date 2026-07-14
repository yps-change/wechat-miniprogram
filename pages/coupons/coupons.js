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

    // 先尝试直达；API 不存在、同步抛错或异步失败时都复制链接兜底。
    if (/^https?:\/\//.test(coupon.url) && typeof wx.openUrl === 'function') {
      try {
        wx.openUrl({
          url: coupon.url,
          fail: function() {
            this.copyCouponUrl(coupon.url);
          }.bind(this)
        });
      } catch (error) {
        this.copyCouponUrl(coupon.url);
      }
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
          content: '自动打开失败，请粘贴到微信或浏览器中打开领取。',
          showCancel: false,
          confirmText: '知道了'
        });
      },
      fail: function() {
        wx.showToast({ title: '复制失败，请长按链接复制', icon: 'none' });
      }
    });
  }
});
