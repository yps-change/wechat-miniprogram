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
 * 构建“让好友帮我推荐”的邀请路径。好友打开后自由推荐一道菜，
 * menuNames 作为可选的快捷建议，sessionId 用于把回传结果绑定到本次邀请。
 */
function buildRecommendSharePath(menuNames, sessionId) {
  var names = (menuNames && menuNames.length > 0) ? menuNames.join('|') : '';
  return '/pages/help-choose/help-choose?mode=recommend&names=' +
    encodeURIComponent(names) + '&sessionId=' + encodeURIComponent(sessionId || '');
}

/**
 * 构建好友推荐菜单的分享路径。sessionId 用于把推荐结果绑定到本次邀请。
 */
function buildMenuSharePath(menuNames, fromName, sessionId) {
  return '/pages/help-choose/help-choose?mode=menu&names=' +
    encodeURIComponent(menuNames.join('|')) + '&from=' + encodeURIComponent(fromName || '好友') +
    '&sessionId=' + encodeURIComponent(sessionId || '');
}

/**
 * 构建好友推荐结果回传给发起者的分享路径。
 */
function buildRecommendationSharePath(foodName, fromName, sessionId) {
  return '/pages/help-choose/help-choose?mode=received&recommend=' +
    encodeURIComponent(foodName || '') + '&from=' + encodeURIComponent(fromName || '好友') +
    '&sessionId=' + encodeURIComponent(sessionId || '');
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
  buildMenuSharePath: buildMenuSharePath,
  buildRecommendSharePath: buildRecommendSharePath,
  buildRecommendationSharePath: buildRecommendationSharePath,
  parseIds: parseIds,
  getFoodsByIds: getFoodsByIds
};
