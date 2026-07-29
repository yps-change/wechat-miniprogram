// 自定义 tabBar：原生 tabBar 图标/文字大小不可调，这里自绘以便放大
Component({
  data: {
    selected: 0,
    color: '#999999',
    selectedColor: '#4A7BF7',
    list: [
      { pagePath: '/pages/index/index', text: '吃什么', iconPath: '/images/icon_1_wheel.png' },
      { pagePath: '/pages/menu/menu', text: '专属菜单', iconPath: '/images/icon_2_dice.png' },
      { pagePath: '/pages/history/history', text: '历史', iconPath: '/images/icon_3_plate.png' }
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
