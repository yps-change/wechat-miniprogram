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
  }
});
