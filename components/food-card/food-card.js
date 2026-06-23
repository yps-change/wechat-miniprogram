Component({
  properties: {
    food: {
      type: Object,
      value: {}
    },
    flipped: {
      type: Boolean,
      value: false
    }
  },

  data: {
    tagNames: {
      spicy: '辣',
      mild: '清淡',
      heavy: '重口味',
      sweet: '偏甜',
      sour: '酸爽',
      fresh: '鲜美'
    }
  },

  methods: {
    reset: function() {
      this.setData({ flipped: false });
    }
  }
});
