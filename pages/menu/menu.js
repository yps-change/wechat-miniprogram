var shareUtil = require('../../utils/share.js');

Page({
  data: {
    menuInput: '',
    customMenu: [],
    useCustomMenu: false,
    currentMenuLabel: '默认美食库'
  },

  onShow: function() {
    this.loadCustomMenu();
  },

  normalizeName: function(name) {
    return (name || '').trim();
  },

  refreshMenuLabel: function() {
    var label = this.data.useCustomMenu && this.data.customMenu.length > 0
      ? '专属菜单 · ' + this.data.customMenu.length + ' 道'
      : '默认美食库';
    this.setData({ currentMenuLabel: label });
  },

  loadCustomMenu: function() {
    var customMenu = wx.getStorageSync('custom_food_menu') || [];
    var useCustomMenu = wx.getStorageSync('use_custom_food_menu');
    useCustomMenu = useCustomMenu === '' ? customMenu.length > 0 : !!useCustomMenu;
    this.setData({
      customMenu: customMenu,
      useCustomMenu: useCustomMenu && customMenu.length > 0
    });
    this.refreshMenuLabel();
  },

  saveCustomMenu: function(customMenu) {
    wx.setStorageSync('custom_food_menu', customMenu);
  },

  onMenuInput: function(e) {
    this.setData({ menuInput: e.detail.value });
  },

  addMenuItem: function() {
    var name = this.normalizeName(this.data.menuInput);
    if (!name) return;

    if (this.data.customMenu.indexOf(name) !== -1) {
      wx.showToast({ title: '菜单里已经有它啦', icon: 'none' });
      return;
    }

    var customMenu = this.data.customMenu.concat([name]);
    this.setData({
      customMenu: customMenu,
      menuInput: '',
      useCustomMenu: true
    });
    wx.setStorageSync('use_custom_food_menu', true);
    this.saveCustomMenu(customMenu);
    this.refreshMenuLabel();
  },

  removeMenuItem: function(e) {
    var index = e.currentTarget.dataset.index;
    var customMenu = this.data.customMenu.slice();
    customMenu.splice(index, 1);
    var useCustomMenu = this.data.useCustomMenu && customMenu.length > 0;
    this.setData({ customMenu: customMenu, useCustomMenu: useCustomMenu });
    wx.setStorageSync('use_custom_food_menu', useCustomMenu);
    this.saveCustomMenu(customMenu);
    this.refreshMenuLabel();
  },

  toggleCustomMenu: function(e) {
    var enabled = e.detail.value && this.data.customMenu.length > 0;
    if (e.detail.value && this.data.customMenu.length === 0) {
      wx.showToast({ title: '先添加你的专属菜品', icon: 'none' });
    }
    this.setData({ useCustomMenu: enabled });
    wx.setStorageSync('use_custom_food_menu', enabled);
    this.refreshMenuLabel();
  },

  generateMenuFromHistory: function() {
    var history = wx.getStorageSync('food_history') || [];
    if (history.length === 0) {
      wx.showToast({ title: '暂无历史记录可生成', icon: 'none' });
      return;
    }

    var namesMap = {};
    history.forEach(function(record) {
      if (record.foodName) namesMap[record.foodName] = true;
    });

    var customMenu = Object.keys(namesMap).slice(0, 12);
    this.setData({ customMenu: customMenu, useCustomMenu: customMenu.length > 0 });
    wx.setStorageSync('use_custom_food_menu', customMenu.length > 0);
    this.saveCustomMenu(customMenu);
    this.refreshMenuLabel();
    wx.showToast({ title: '已从历史生成', icon: 'none' });
  },

  onShareAppMessage: function() {
    // “让好友帮我推荐”：把我的专属菜单作为可选建议带过去，好友自由推荐一道菜。
    var menuNames = this.data.customMenu.length > 0 ? this.data.customMenu : [];
    var sessionId = Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
    return {
      title: '🍜 帮我推荐一道今天的午饭吧，纠结中…',
      path: shareUtil.buildRecommendSharePath(menuNames, sessionId)
    };
  }
});
