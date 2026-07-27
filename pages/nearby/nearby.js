/**
 * 附近餐馆全屏地图页
 * 入口：首页结果弹窗「附近」一行入口，带 keyword（菜名）进入。
 * 上半屏大地图标注附近 5 家店，下半屏列表，点列表定位、点导航打开内置地图。
 */
var logger = require('../../utils/logger.js');
var nearbyUtil = require('../../utils/nearby.js');

Page({
  data: {
    keyword: '',
    loading: true,
    shops: [],          // {title,address,distanceText,latitude,longitude}
    markers: [],
    mapLatitude: 0,
    mapLongitude: 0,
    activeIndex: 0      // 当前选中的店铺下标
  },

  onLoad: function(options) {
    var keyword = decodeURIComponent(options.keyword || '');
    this.setData({ keyword: keyword });
    wx.setNavigationBarTitle({ title: '附近的「' + keyword + '」' });

    var that = this;
    var loc = nearbyUtil.getCachedLocation();
    if (loc) {
      this.searchAndRender(loc);
    } else {
      // 无缓存位置：先让用户在地图上确认位置
      nearbyUtil.chooseLocation(function(picked) {
        if (picked) {
          that.searchAndRender(picked);
        } else {
          // 用户取消选点，返回上一页
          wx.navigateBack();
        }
      });
    }
  },

  searchAndRender: function(loc) {
    var that = this;
    var keyword = this.data.keyword;
    this.userLoc = loc;
    this.setData({ loading: true });

    nearbyUtil.searchNearby(keyword, loc.latitude, loc.longitude, function(list) {
      if (list.length === 0) {
        that.setData({ loading: false, shops: [] });
        return;
      }
      var shops = list.map(function(item) {
        return {
          title: item.title,
          address: item.address,
          distanceText: nearbyUtil.formatDistance(item._distance),
          latitude: item.location.lat,
          longitude: item.location.lng
        };
      });
      that.setData({
        loading: false,
        shops: shops,
        markers: that.buildMarkers(shops, 0),
        mapLatitude: shops[0].latitude,
        mapLongitude: shops[0].longitude,
        activeIndex: 0
      });
    });
  },

  // 生成标记：选中的店常显气泡，其余点击显示
  buildMarkers: function(shops, activeIndex) {
    return shops.map(function(shop, index) {
      return {
        id: index,
        latitude: shop.latitude,
        longitude: shop.longitude,
        iconPath: '/images/marker_food.png',
        width: index === activeIndex ? 34 : 28,
        height: index === activeIndex ? 42 : 35,
        callout: {
          content: shop.title + '  ' + shop.distanceText,
          fontSize: 12,
          borderRadius: 8,
          padding: 6,
          display: index === activeIndex ? 'ALWAYS' : 'BYCLICK'
        }
      };
    });
  },

  // 点列表项：地图跳到对应店铺
  onSelectShop: function(e) {
    var index = e.currentTarget.dataset.index;
    var shop = this.data.shops[index];
    if (!shop) return;
    this.setData({
      activeIndex: index,
      markers: this.buildMarkers(this.data.shops, index),
      mapLatitude: shop.latitude,
      mapLongitude: shop.longitude
    });
  },

  // 点地图标记：同步选中列表项
  onMarkerTap: function(e) {
    var index = e.detail.markerId;
    if (index == null) return;
    this.setData({
      activeIndex: index,
      markers: this.buildMarkers(this.data.shops, index)
    });
  },

  // 导航按钮：打开微信内置地图
  onNavigate: function(e) {
    var index = e.currentTarget.dataset.index;
    var shop = this.data.shops[index];
    if (!shop) return;
    logger.info('nearby', '导航到 ' + shop.title);
    wx.openLocation({
      latitude: shop.latitude,
      longitude: shop.longitude,
      name: shop.title,
      address: shop.address,
      scale: 16
    });
  },

  // 换个位置重新搜
  onRelocate: function() {
    var that = this;
    nearbyUtil.chooseLocation(function(picked) {
      if (picked) that.searchAndRender(picked);
    });
  }
});
