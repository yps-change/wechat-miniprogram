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
    if (!coupon) return;

    var copyText = coupon.copyText || coupon.url;
    if (!copyText) return;

    wx.setClipboardData({
      data: copyText,
      success: function() {
        wx.showModal({
          title: '内容已复制',
          content: '请打开' + (coupon.appName || (platform && platform.name) || '对应 App') +
            '，粘贴到搜索框或红包入口中，等待 App 自动识别后领取。',
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
