/**
 * 订阅消息工具：饭点提醒
 *
 * 模板「产品使用提醒」，关键词：产品名称 / 使用时间 / 备注。
 * 个人主体只有一次性订阅：用户点一次授权 = 攒一条发送额度。
 * 运营策略：在用户确认结果等点击时机请求授权，把额度攒起来；
 * 用户勾选“总是保持以上选择”后，后续调用会静默通过，不再弹窗。
 *
 * ⚠️ wx.requestSubscribeMessage 必须在用户点击事件的调用链里发起，
 *    不能在 onLoad/onShow/setTimeout 里调用，否则直接 fail。
 */
var logger = require('./logger.js');

var MEAL_REMINDER_TMPL_ID = 'Yq-OXFyqYMHS5uDMHndI3lnEXUCZE9k0tBK3uv84iBI';

// 请求“饭点提醒”订阅授权。静默失败，不打断主流程。
function requestMealReminder() {
  // 当天明确拒绝过就不再打扰，避免反感
  var today = new Date().toDateString();
  if (wx.getStorageSync('meal_reminder_reject_date') === today) return;

  wx.requestSubscribeMessage({
    tmplIds: [MEAL_REMINDER_TMPL_ID],
    success: function(res) {
      var result = res[MEAL_REMINDER_TMPL_ID];
      logger.info('subscribe', '饭点提醒订阅结果=' + result);
      if (result === 'accept') {
        // 本地记一笔攒下的额度，供后续接入云函数推送时参考
        var quota = wx.getStorageSync('meal_reminder_quota') || 0;
        wx.setStorageSync('meal_reminder_quota', quota + 1);
      } else if (result === 'reject') {
        wx.setStorageSync('meal_reminder_reject_date', today);
      }
      // 'ban'（被封禁）/ 'filter'（同名模板被过滤）不处理，静默即可
    },
    fail: function(err) {
      // 常见于开发者工具不支持或未在点击链路中调用
      logger.warn('subscribe', '订阅请求失败', err);
    }
  });
}

module.exports = {
  MEAL_REMINDER_TMPL_ID: MEAL_REMINDER_TMPL_ID,
  requestMealReminder: requestMealReminder
};
