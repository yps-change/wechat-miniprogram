// 时段场景工具：按当前时间/星期生成场景化的分享标题
// 纯前端判断，让分享标题贴合“此刻”的吃饭场景（周五犒劳、深夜夜宵等），提高好友点开率

// 当前时段对应的一餐叫法
function getMealName() {
  var hour = new Date().getHours();
  if (hour >= 21 || hour < 5) return '夜宵';
  if (hour < 10) return '早饭';
  if (hour < 16) return '午饭';
  return '晚饭';
}

// “让好友帮我推荐”的场景化标题（专属菜单页分享）
function getRecommendShareTitle() {
  var now = new Date();
  var hour = now.getHours();
  var day = now.getDay();
  // 深夜/凌晨：夜宵纠结局
  if (hour >= 21 || hour < 5) {
    return '🌙 深夜纠结局：帮我推荐一道夜宵吧！';
  }
  // 周五下午起：犒劳自己
  if (day === 5 && hour >= 16) {
    return '🎉 周五啦！帮我推荐一道好吃的犒劳自己';
  }
  // 周末午/晚饭：不想动
  if ((day === 0 || day === 6) && hour >= 10) {
    return '🛋️ 周末不想动，帮我推荐一道今天的' + getMealName() + '呗';
  }
  return '🍜 帮我推荐一道今天的' + getMealName() + '吧，纠结中…';
}

// 首页“帮我抽一个”的场景化标题
function getRandomShareTitle() {
  var now = new Date();
  var hour = now.getHours();
  var day = now.getDay();
  if (hour >= 21 || hour < 5) {
    return '🌙 这个点还饿着？帮我抽一个夜宵吃啥！';
  }
  if (day === 5 && hour >= 16) {
    return '🎉 周五晚上吃点好的，帮我抽一个！';
  }
  return '🎯 选择困难晚期，帮我抽一个今天吃啥！';
}

module.exports = {
  getMealName: getMealName,
  getRecommendShareTitle: getRecommendShareTitle,
  getRandomShareTitle: getRandomShareTitle
};
