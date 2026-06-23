/**
 * 随机选取工具函数
 */

/**
 * 从数组中随机选取一个元素
 */
function getRandomOne(list) {
  if (!list || list.length === 0) return null;
  var index = Math.floor(Math.random() * list.length);
  return list[index];
}

/**
 * 从数组中随机选取多个不重复元素
 */
function getRandomMultiple(list, count) {
  if (!list || list.length === 0) return [];
  count = Math.min(count, list.length);
  var shuffled = list.slice();
  // Fisher-Yates 洗牌算法
  for (var i = shuffled.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled.slice(0, count);
}

/**
 * 根据条件过滤菜品
 * @param {Array} foods - 菜品列表
 * @param {Object} filters - 过滤条件 { category, tags, priceLevel }
 */
function filterFoods(foods, filters) {
  if (!filters) return foods;
  return foods.filter(function(food) {
    if (filters.category && food.category !== filters.category) return false;
    if (filters.priceLevel && food.priceLevel !== filters.priceLevel) return false;
    if (filters.excludeTags && filters.excludeTags.length > 0) {
      for (var i = 0; i < filters.excludeTags.length; i++) {
        if (food.tags.indexOf(filters.excludeTags[i]) !== -1) return false;
      }
    }
    return true;
  });
}

/**
 * 从菜品列表中排除已有ID的菜品，再随机选取
 */
function getRandomExcluding(foods, excludeIds, count) {
  var filtered = foods.filter(function(food) {
    return excludeIds.indexOf(food.id) === -1;
  });
  if (count === 1) return getRandomOne(filtered);
  return getRandomMultiple(filtered, count);
}

module.exports = {
  getRandomOne: getRandomOne,
  getRandomMultiple: getRandomMultiple,
  filterFoods: filterFoods,
  getRandomExcluding: getRandomExcluding
};
