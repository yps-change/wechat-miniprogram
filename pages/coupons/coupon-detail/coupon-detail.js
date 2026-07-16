var couponConfig = require('../../../utils/coupon-config.js');
var meituanLink = require('../../../utils/meituan-link.js');

Page({
  data: {
    platform: {},
    coupon: {},
    copyText: '',
    linkLoading: false
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
      copyText: coupon.copyText || coupon.url || '',
      linkLoading: platform.id === 'meituan' && !!coupon.activityId
    });

    if (platform.id === 'meituan' && coupon.activityId) {
      this.loadLatestMeituanLink(coupon);
    }
  },

  loadLatestMeituanLink: function(coupon) {
    var that = this;
    meituanLink.getLatestLink(coupon, {
      success: function(link) {
        that.setData({
          copyText: link.copyText || link.linkUrl,
          'coupon.url': link.linkUrl,
          linkLoading: false
        });
      },
      fallback: function() {
        that.setData({ linkLoading: false });
      }
    });
  },

  copyCode: function() {
    var platform = this.data.platform;
    var coupon = this.data.coupon;
    var copyText = this.data.copyText;
    if (this.data.linkLoading) {
      wx.showToast({ title: '正在获取最新链接', icon: 'loading' });
      return;
    }
    if (!copyText) {
      wx.showToast({ title: '暂无可复制口令', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: copyText,
      success: function() {
        wx.showModal({
          title: '口令已复制',
          content: platform.id === 'taobao-flash'
            ? '淘口令已复制！打开淘宝 App 自动识别'
            : (platform.id === 'meituan'
              ? '请直接切换或打开美团 App。若美团已在前台，请先进入首页或下拉刷新，再粘贴口令；美团会根据剪贴板内容弹出对应活动页面。'
              : (coupon.copySuccessMessage || ('现在打开' + (coupon.appName || platform.name) + '，粘贴到搜索框，App 会自动识别并弹出红包。'))),
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