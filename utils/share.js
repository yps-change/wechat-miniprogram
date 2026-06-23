/**
 * 分享参数编解码工具
 */

/**
 * 构建"帮我随机抽"的分享路径
 * @param {string} fromName - 分享者昵称
 */
function buildRandomSharePath(fromName) {
  return '/pages/help-random/help-random?mode=random&from=' + encodeURIComponent(fromName || '好友');
}

/**
 * 构建"帮我从候选里选"的分享路径
 * @param {Array} candidateIds - 候选菜品ID数组
 * @param {string} fromName - 分享者昵称
 */
function buildChooseSharePath(candidateIds, fromName) {
  var ids = candidateIds.join(',');
  return '/pages/help-choose/help-choose?mode=choose&ids=' + ids + '&from=' + encodeURIComponent(fromName || '好友');
}

/**
 * 解析分享参数中的候选ID列表
 * @param {string} idsStr - 逗号分隔的ID字符串
 */
function parseIds(idsStr) {
  if (!idsStr) return [];
  return idsStr.split(',').map(function(id) {
    return parseInt(id, 10);
  }).filter(function(id) {
    return !isNaN(id);
  });
}

/**
 * 根据ID列表从菜品库中获取菜品
 * @param {Array} foods - 完整菜品列表
 * @param {Array} ids - ID数组
 */
function getFoodsByIds(foods, ids) {
  return ids.map(function(id) {
    return foods.find(function(food) {
      return food.id === id;
    });
  }).filter(function(food) {
    return food != null;
  });
}

module.exports = {
  buildRandomSharePath: buildRandomSharePath,
  buildChooseSharePath: buildChooseSharePath,
  parseIds: parseIds,
  getFoodsByIds: getFoodsByIds
};
