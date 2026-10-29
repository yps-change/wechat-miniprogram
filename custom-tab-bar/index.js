Component({
  data: {
    selected: 0,
    color: '#817D70',
    selectedColor: '#BD4828',
    list: [
      { pagePath: '/pages/index/index', text: '吃什么', iconPath: '/images/theme/wheel-muted.png', selectedIconPath: '/images/theme/wheel-active.png' },
      { pagePath: '/pages/menu/menu', text: '专属菜单', iconPath: '/images/theme/menu-muted.png', selectedIconPath: '/images/theme/menu-active.png' },
      { pagePath: '/pages/history/history', text: '历史', iconPath: '/images/theme/history-muted.png', selectedIconPath: '/images/theme/history-active.png' }
    ]
  },

  methods: {
    onTabTap: function(e) {
      var index = e.currentTarget.dataset.index;
      var path = e.currentTarget.dataset.path;
      if (index === this.data.selected) return;
      wx.switchTab({ url: path });
    }
  }
});
