/**
 * 菜品池工具：默认菜库 / 专属菜单的统一读取与自定义菜品规范化
 * 供首页转盘与结果页共用，保证「换一个」与转盘用同一个池子。
 */
var foodsData = require('../data/foods.js');

// 根据菜名智能匹配 emoji（顺序敏感：更具体的关键词在前）
var EMOJI_RULES = [
  [['寿司', '刺身', '生鱼片'], '🍣'],
  [['天妇罗', '虾'], '🍤'],
  [['咖喱'], '🍛'],
  [['汉堡', '堡'], '🍔'],
  [['披萨', '比萨', '匹萨'], '🍕'],
  [['薯条'], '🍟'],
  [['沙拉', '轻食', '蔬菜'], '🥗'],
  [['三明治'], '🥪'],
  [['牛油果'], '🥑'],
  [['粥'], '🥣'],
  [['饺', '馄饨', '云吞', '烧麦', '肠粉', '包'], '🥟'],
  [['煎饼', '肉夹馍', '馍', '饼'], '🫓'],
  [['卷'], '🌯'],
  [['串串', '串'], '🍢'],
  [['火锅', '麻辣烫', '冒菜', '香锅', '锅'], '🍲'],
  [['鸭', '鹅'], '🦆'],
  [['鱼'], '🐟'],
  [['鸡'], '🍗'],
  [['牛排', '排', '牛肉', '肉'], '🥩'],
  [['麻辣', '辣', '川'], '🌶️'],
  [['蛋'], '🍳'],
  [['面', '粉', '米线'], '🍜'],
  [['饭', '煲仔'], '🍚'],
  [['奶', '酸奶'], '🥛']
];

function guessEmoji(name) {
  var cleanName = (name || '').trim();
  if (!cleanName) return '🍽️';
  // 1. 默认菜品库精确匹配
  var foods = foodsData.foods || [];
  for (var i = 0; i < foods.length; i++) {
    if (foods[i].name === cleanName && foods[i].emoji) return foods[i].emoji;
  }
  // 2. 关键词匹配
  for (var r = 0; r < EMOJI_RULES.length; r++) {
    var keys = EMOJI_RULES[r][0];
    for (var k = 0; k < keys.length; k++) {
      if (cleanName.indexOf(keys[k]) !== -1) return EMOJI_RULES[r][1];
    }
  }
  // 3. 兜底
  return '🍽️';
}

function normalizeCustomFood(name, index) {
  var cleanName = (name || '').trim();
  return {
    id: 'custom_' + cleanName + '_' + index,
    name: cleanName,
    category: 'custom',
    categoryName: '专属菜单',
    tags: ['custom'],
    priceRange: '自定',
    priceLevel: 1,
    emoji: guessEmoji(cleanName),
    isCustom: true
  };
}

// 读取专属菜单（已规范化）
function getCustomMenu() {
  var rawMenu = wx.getStorageSync('custom_food_menu') || [];
  return rawMenu.map(function(name, index) {
    return normalizeCustomFood(name, index);
  });
}

// 当前生效的菜品池：启用专属菜单且非空时用专属菜单，否则默认菜库
function getPool() {
  var useCustomMenu = wx.getStorageSync('use_custom_food_menu');
  if (useCustomMenu) {
    var customMenu = getCustomMenu();
    if (customMenu.length > 0) return customMenu;
  }
  return foodsData.foods;
}

module.exports = {
  guessEmoji: guessEmoji,
  normalizeCustomFood: normalizeCustomFood,
  getCustomMenu: getCustomMenu,
  getPool: getPool
};
