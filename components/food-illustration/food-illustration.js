var foodArt = require('../../utils/food-art.js');

Component({
  properties: {
    food: { type: Object, value: {} },
    size: { type: Number, value: 120 }
  },
  data: {
    imagePath: '/images/theme/food-default.png'
  },
  observers: {
    food: function(food) {
      this.setData({ imagePath: foodArt.getFoodArt(food) });
    }
  }
});
