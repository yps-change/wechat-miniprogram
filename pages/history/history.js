Page({
  data: {
    historyList: [],
    groupedHistory: [],
    sourceNames: {
      self: '自己选的',
      friend_random: '朋友帮抽',
      friend_choose: '朋友帮选'
    }
  },

  onShow: function() {
    this.loadHistory();
  },

  loadHistory: function() {
    var history = wx.getStorageSync('food_history') || [];
    var grouped = this.groupByDate(history);
    this.setData({
      historyList: history,
      groupedHistory: grouped
    });
  },

  groupByDate: function(list) {
    var groups = {};
    list.forEach(function(record) {
      var date = this.formatDate(record.timestamp);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(record);
    }.bind(this));

    return Object.keys(groups).map(function(date) {
      return { date: date, records: groups[date] };
    });
  },

  formatDate: function(timestamp) {
    var d = new Date(timestamp);
    var today = new Date();
    var yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return '今天';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return '昨天';
    } else {
      return (d.getMonth() + 1) + '月' + d.getDate() + '日';
    }
  },

  onClear: function() {
    var that = this;
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有记录吗？',
      success: function(res) {
        if (res.confirm) {
          wx.removeStorageSync('food_history');
          that.setData({
            historyList: [],
            groupedHistory: []
          });
          wx.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  }
});
