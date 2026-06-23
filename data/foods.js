/**
 * 菜品数据库
 * 覆盖：中餐、西餐、日料、韩餐、快餐、面食、粥粉、轻食沙拉、火锅麻辣烫、烧烤
 */
const foods = [
  // === 中餐 ===
  { id: 1, name: "黄焖鸡米饭", category: "chinese", categoryName: "中餐", tags: ["heavy"], priceRange: "15-25", priceLevel: 1, emoji: "🍗" },
  { id: 2, name: "宫保鸡丁饭", category: "chinese", categoryName: "中餐", tags: ["spicy"], priceRange: "18-28", priceLevel: 1, emoji: "🌶️" },
  { id: 3, name: "鱼香肉丝饭", category: "chinese", categoryName: "中餐", tags: ["sweet", "sour"], priceRange: "18-28", priceLevel: 1, emoji: "🍚" },
  { id: 4, name: "麻婆豆腐饭", category: "chinese", categoryName: "中餐", tags: ["spicy"], priceRange: "15-22", priceLevel: 1, emoji: "🌶️" },
  { id: 5, name: "红烧排骨饭", category: "chinese", categoryName: "中餐", tags: ["heavy"], priceRange: "25-35", priceLevel: 2, emoji: "🍖" },
  { id: 6, name: "糖醋里脊饭", category: "chinese", categoryName: "中餐", tags: ["sweet", "sour"], priceRange: "20-30", priceLevel: 2, emoji: "🍖" },
  { id: 7, name: "回锅肉饭", category: "chinese", categoryName: "中餐", tags: ["spicy", "heavy"], priceRange: "18-28", priceLevel: 1, emoji: "🥩" },
  { id: 8, name: "木须肉饭", category: "chinese", categoryName: "中餐", tags: ["mild"], priceRange: "18-25", priceLevel: 1, emoji: "🥚" },
  { id: 9, name: "卤肉饭", category: "chinese", categoryName: "中餐", tags: ["heavy"], priceRange: "15-22", priceLevel: 1, emoji: "🍚" },
  { id: 10, name: "煲仔饭", category: "chinese", categoryName: "中餐", tags: ["heavy"], priceRange: "25-38", priceLevel: 2, emoji: "🍲" },
  { id: 11, name: "烤鱼饭", category: "chinese", categoryName: "中餐", tags: ["spicy", "fresh"], priceRange: "28-40", priceLevel: 2, emoji: "🐟" },
  { id: 12, name: "水煮肉片饭", category: "chinese", categoryName: "中餐", tags: ["spicy"], priceRange: "22-32", priceLevel: 2, emoji: "🌶️" },

  // === 西餐 ===
  { id: 13, name: "意大利肉酱面", category: "western", categoryName: "西餐", tags: ["heavy"], priceRange: "25-40", priceLevel: 2, emoji: "🍝" },
  { id: 14, name: "奶油培根意面", category: "western", categoryName: "西餐", tags: ["heavy"], priceRange: "28-42", priceLevel: 2, emoji: "🍝" },
  { id: 15, name: "牛肉汉堡", category: "western", categoryName: "西餐", tags: ["heavy"], priceRange: "25-45", priceLevel: 2, emoji: "🍔" },
  { id: 16, name: "黑椒牛排", category: "western", categoryName: "西餐", tags: ["heavy"], priceRange: "45-80", priceLevel: 3, emoji: "🥩" },
  { id: 17, name: "凯撒沙拉配鸡排", category: "western", categoryName: "西餐", tags: ["mild"], priceRange: "30-45", priceLevel: 2, emoji: "🥗" },
  { id: 18, name: "披萨", category: "western", categoryName: "西餐", tags: ["heavy"], priceRange: "30-55", priceLevel: 2, emoji: "🍕" },

  // === 日料 ===
  { id: 19, name: "三文鱼刺身饭", category: "japanese", categoryName: "日料", tags: ["fresh"], priceRange: "35-55", priceLevel: 3, emoji: "🍣" },
  { id: 20, name: "日式咖喱饭", category: "japanese", categoryName: "日料", tags: ["mild"], priceRange: "25-38", priceLevel: 2, emoji: "🍛" },
  { id: 21, name: "豚骨拉面", category: "japanese", categoryName: "日料", tags: ["heavy", "fresh"], priceRange: "30-45", priceLevel: 2, emoji: "🍜" },
  { id: 22, name: "鳗鱼饭", category: "japanese", categoryName: "日料", tags: ["sweet", "fresh"], priceRange: "38-60", priceLevel: 3, emoji: "🍱" },
  { id: 23, name: "天妇罗定食", category: "japanese", categoryName: "日料", tags: ["mild"], priceRange: "35-50", priceLevel: 3, emoji: "🍤" },
  { id: 24, name: "寿司拼盘", category: "japanese", categoryName: "日料", tags: ["fresh"], priceRange: "30-55", priceLevel: 3, emoji: "🍣" },
  { id: 25, name: "牛丼饭", category: "japanese", categoryName: "日料", tags: ["mild"], priceRange: "22-35", priceLevel: 2, emoji: "🍚" },

  // === 韩餐 ===
  { id: 26, name: "石锅拌饭", category: "korean", categoryName: "韩餐", tags: ["spicy"], priceRange: "22-35", priceLevel: 2, emoji: "🍲" },
  { id: 27, name: "韩式炸鸡", category: "korean", categoryName: "韩餐", tags: ["sweet", "spicy"], priceRange: "30-50", priceLevel: 2, emoji: "🍗" },
  { id: 28, name: "部队锅", category: "korean", categoryName: "韩餐", tags: ["spicy"], priceRange: "35-55", priceLevel: 2, emoji: "🍲" },
  { id: 29, name: "韩式烤肉饭", category: "korean", categoryName: "韩餐", tags: ["heavy"], priceRange: "28-42", priceLevel: 2, emoji: "🥩" },
  { id: 30, name: "泡菜豆腐汤", category: "korean", categoryName: "韩餐", tags: ["spicy", "sour"], priceRange: "22-32", priceLevel: 2, emoji: "🥘" },
  { id: 31, name: "紫菜包饭", category: "korean", categoryName: "韩餐", tags: ["mild"], priceRange: "15-25", priceLevel: 1, emoji: "🍙" },

  // === 快餐 ===
  { id: 32, name: "麦辣鸡腿堡套餐", category: "fastfood", categoryName: "快餐", tags: ["spicy"], priceRange: "25-40", priceLevel: 2, emoji: "🍔" },
  { id: 33, name: "香辣鸡翅桶", category: "fastfood", categoryName: "快餐", tags: ["spicy"], priceRange: "30-50", priceLevel: 2, emoji: "🍗" },
  { id: 34, name: "照烧鸡排饭", category: "fastfood", categoryName: "快餐", tags: ["sweet"], priceRange: "20-30", priceLevel: 1, emoji: "🍱" },
  { id: 35, name: "炸鸡排套餐", category: "fastfood", categoryName: "快餐", tags: ["heavy"], priceRange: "18-28", priceLevel: 1, emoji: "🍗" },
  { id: 36, name: "鸡肉卷套餐", category: "fastfood", categoryName: "快餐", tags: ["mild"], priceRange: "22-35", priceLevel: 2, emoji: "🌯" },
  { id: 37, name: "薯条汉堡套餐", category: "fastfood", categoryName: "快餐", tags: ["heavy"], priceRange: "25-40", priceLevel: 2, emoji: "🍟" },

  // === 面食 ===
  { id: 38, name: "兰州拉面", category: "noodle", categoryName: "面食", tags: ["mild", "fresh"], priceRange: "12-20", priceLevel: 1, emoji: "🍜" },
  { id: 39, name: "重庆小面", category: "noodle", categoryName: "面食", tags: ["spicy"], priceRange: "12-18", priceLevel: 1, emoji: "🌶️" },
  { id: 40, name: "刀削面", category: "noodle", categoryName: "面食", tags: ["mild"], priceRange: "15-22", priceLevel: 1, emoji: "🍜" },
  { id: 41, name: "武汉热干面", category: "noodle", categoryName: "面食", tags: ["heavy"], priceRange: "10-18", priceLevel: 1, emoji: "🍜" },
  { id: 42, name: "炸酱面", category: "noodle", categoryName: "面食", tags: ["heavy"], priceRange: "15-22", priceLevel: 1, emoji: "🍜" },
  { id: 43, name: "酸辣粉", category: "noodle", categoryName: "面食", tags: ["spicy", "sour"], priceRange: "12-20", priceLevel: 1, emoji: "🌶️" },
  { id: 44, name: "螺蛳粉", category: "noodle", categoryName: "面食", tags: ["spicy", "sour"], priceRange: "15-25", priceLevel: 1, emoji: "🍜" },
  { id: 45, name: "阳春面", category: "noodle", categoryName: "面食", tags: ["mild"], priceRange: "10-15", priceLevel: 1, emoji: "🍜" },
  { id: 46, name: "担担面", category: "noodle", categoryName: "面食", tags: ["spicy"], priceRange: "15-22", priceLevel: 1, emoji: "🌶️" },
  { id: 47, name: "牛肉板面", category: "noodle", categoryName: "面食", tags: ["spicy"], priceRange: "12-20", priceLevel: 1, emoji: "🍜" },

  // === 粥粉 ===
  { id: 48, name: "皮蛋瘦肉粥", category: "congee", categoryName: "粥粉", tags: ["mild"], priceRange: "10-18", priceLevel: 1, emoji: "🥣" },
  { id: 49, name: "广式肠粉", category: "congee", categoryName: "粥粉", tags: ["mild"], priceRange: "12-20", priceLevel: 1, emoji: "🥟" },
  { id: 50, name: "河粉炒牛肉", category: "congee", categoryName: "粥粉", tags: ["mild"], priceRange: "18-28", priceLevel: 1, emoji: "🍜" },
  { id: 51, name: "砂锅粥", category: "congee", categoryName: "粥粉", tags: ["fresh"], priceRange: "20-35", priceLevel: 2, emoji: "🍲" },
  { id: 52, name: "云吞面", category: "congee", categoryName: "粥粉", tags: ["mild", "fresh"], priceRange: "15-22", priceLevel: 1, emoji: "🥟" },
  { id: 53, name: "桂林米粉", category: "congee", categoryName: "粥粉", tags: ["mild"], priceRange: "12-18", priceLevel: 1, emoji: "🍜" },

  // === 轻食沙拉 ===
  { id: 54, name: "鸡胸肉沙拉", category: "salad", categoryName: "轻食", tags: ["mild"], priceRange: "25-40", priceLevel: 2, emoji: "🥗" },
  { id: 55, name: "三明治", category: "salad", categoryName: "轻食", tags: ["mild"], priceRange: "18-30", priceLevel: 2, emoji: "🥪" },
  { id: 56, name: "全麦鸡肉卷", category: "salad", categoryName: "轻食", tags: ["mild"], priceRange: "22-35", priceLevel: 2, emoji: "🌯" },
  { id: 57, name: "牛油果沙拉碗", category: "salad", categoryName: "轻食", tags: ["mild", "fresh"], priceRange: "30-45", priceLevel: 2, emoji: "🥑" },
  { id: 58, name: "藜麦蔬菜碗", category: "salad", categoryName: "轻食", tags: ["mild"], priceRange: "28-40", priceLevel: 2, emoji: "🥗" },
  { id: 59, name: "酸奶燕麦杯", category: "salad", categoryName: "轻食", tags: ["sweet"], priceRange: "18-28", priceLevel: 1, emoji: "🥛" },

  // === 火锅麻辣烫 ===
  { id: 60, name: "麻辣烫", category: "hotpot", categoryName: "火锅/麻辣烫", tags: ["spicy"], priceRange: "18-35", priceLevel: 1, emoji: "🍲" },
  { id: 61, name: "冒菜", category: "hotpot", categoryName: "火锅/麻辣烫", tags: ["spicy"], priceRange: "20-35", priceLevel: 2, emoji: "🌶️" },
  { id: 62, name: "麻辣香锅", category: "hotpot", categoryName: "火锅/麻辣烫", tags: ["spicy", "heavy"], priceRange: "30-50", priceLevel: 2, emoji: "🍳" },
  { id: 63, name: "旋转小火锅", category: "hotpot", categoryName: "火锅/麻辣烫", tags: ["spicy"], priceRange: "30-50", priceLevel: 2, emoji: "🍲" },
  { id: 64, name: "骨汤麻辣烫", category: "hotpot", categoryName: "火锅/麻辣烫", tags: ["fresh"], priceRange: "20-35", priceLevel: 2, emoji: "🍲" },
  { id: 65, name: "串串香", category: "hotpot", categoryName: "火锅/麻辣烫", tags: ["spicy"], priceRange: "25-45", priceLevel: 2, emoji: "🍢" },

  // === 烧烤 ===
  { id: 66, name: "烤肉拌饭", category: "bbq", categoryName: "烧烤", tags: ["heavy"], priceRange: "18-28", priceLevel: 1, emoji: "🥩" },
  { id: 67, name: "烧腊双拼饭", category: "bbq", categoryName: "烧烤", tags: ["heavy"], priceRange: "25-38", priceLevel: 2, emoji: "🍗" },
  { id: 68, name: "脆皮烧鹅饭", category: "bbq", categoryName: "烧烤", tags: ["heavy"], priceRange: "28-40", priceLevel: 2, emoji: "🦆" },
  { id: 69, name: "叉烧饭", category: "bbq", categoryName: "烧烤", tags: ["sweet", "heavy"], priceRange: "22-32", priceLevel: 2, emoji: "🍖" },
  { id: 70, name: "烤鸭饭", category: "bbq", categoryName: "烧烤", tags: ["heavy"], priceRange: "25-38", priceLevel: 2, emoji: "🦆" },

  // === 其他特色 ===
  { id: 71, name: "沙县小吃套餐", category: "chinese", categoryName: "中餐", tags: ["mild"], priceRange: "12-20", priceLevel: 1, emoji: "🥟" },
  { id: 72, name: "饺子", category: "chinese", categoryName: "中餐", tags: ["mild"], priceRange: "15-25", priceLevel: 1, emoji: "🥟" },
  { id: 73, name: "馄饨", category: "chinese", categoryName: "中餐", tags: ["mild", "fresh"], priceRange: "12-20", priceLevel: 1, emoji: "🥟" },
  { id: 74, name: "煎饼果子", category: "chinese", categoryName: "中餐", tags: ["mild"], priceRange: "8-15", priceLevel: 1, emoji: "🫓" },
  { id: 75, name: "烧麦", category: "chinese", categoryName: "中餐", tags: ["mild"], priceRange: "12-20", priceLevel: 1, emoji: "🥟" },
  { id: 76, name: "肉夹馍", category: "chinese", categoryName: "中餐", tags: ["heavy"], priceRange: "10-18", priceLevel: 1, emoji: "🫓" },
  { id: 77, name: "蛋炒饭", category: "chinese", categoryName: "中餐", tags: ["mild"], priceRange: "12-18", priceLevel: 1, emoji: "🍳" },
  { id: 78, name: "扬州炒饭", category: "chinese", categoryName: "中餐", tags: ["mild"], priceRange: "15-22", priceLevel: 1, emoji: "🍚" },
  { id: 79, name: "咖喱鸡饭", category: "chinese", categoryName: "中餐", tags: ["mild"], priceRange: "18-28", priceLevel: 1, emoji: "🍛" },
  { id: 80, name: "东坡肉饭", category: "chinese", categoryName: "中餐", tags: ["heavy", "sweet"], priceRange: "25-38", priceLevel: 2, emoji: "🍖" }
];

// 分类列表
const categories = [
  { key: "chinese", name: "中餐", emoji: "🥢" },
  { key: "western", name: "西餐", emoji: "🍴" },
  { key: "japanese", name: "日料", emoji: "🍣" },
  { key: "korean", name: "韩餐", emoji: "🇰🇷" },
  { key: "fastfood", name: "快餐", emoji: "🍔" },
  { key: "noodle", name: "面食", emoji: "🍜" },
  { key: "congee", name: "粥粉", emoji: "🥣" },
  { key: "salad", name: "轻食", emoji: "🥗" },
  { key: "hotpot", name: "火锅/麻辣烫", emoji: "🍲" },
  { key: "bbq", name: "烧烤", emoji: "🔥" }
];

module.exports = {
  foods,
  categories
};
