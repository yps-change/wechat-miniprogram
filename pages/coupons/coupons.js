var couponConfig = require('../../utils/coupon-config.js');

Page({
  data: {
    platforms: []
  },

  onLoad: function() {
    this.setData({ platforms: couponConfig.platforms });
  },

  openCoupon: function(e) {
    var index = e.currentTarget.dataset.index;
    var platform = this.data.platforms[index];
    if (!platform || !platform.url) {
      wx.showModal({
        title: '链接待配置',
        content: '请先在 utils/coupon-config.js 中填入该平台的联盟推广链接。',
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }

    wx.setClipboardData({
      data: platform.url,
      success: function() {
        wx.showToast({ title: '链接已复制', icon: 'success' });
      }
    });
  }
});
