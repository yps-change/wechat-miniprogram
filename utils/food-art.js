var ICONS = {
  '1f35a': 'rice', '1f35b': 'rice', '1f371': 'rice', '1f373': 'rice',
  '1f35c': 'noodle', '1f35d': 'noodle',
  '1f354': 'burger', '1f35f': 'burger',
  '1f957': 'salad', '1f951': 'salad',
  '1f363': 'sushi', '1f359': 'sushi',
  '1f95f': 'dumpling',
  '1f372': 'pot', '1f958': 'pot', '1f963': 'pot',
  '1f357': 'chicken'
};
var CATEGORIES = {
  chinese: 'rice', western: 'burger', japanese: 'sushi', korean: 'pot',
  fastfood: 'burger', noodle: 'noodle', congee: 'pot', salad: 'salad',
  hotpot: 'pot', bbq: 'rice'
};

function getFoodArt(food) {
  food = food || {};
  var icon = food.emoji ? ICONS[food.emoji.codePointAt(0).toString(16)] : '';
  return '/images/theme/food-' + (icon || CATEGORIES[food.category] || 'default') + '.png';
}

module.exports = { getFoodArt: getFoodArt };
