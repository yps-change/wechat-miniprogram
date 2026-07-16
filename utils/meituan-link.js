/**
 * 从业务后端读取美团联盟最新推广链接。
 * 美团 AppKey/AppSecret 只能放在后端，不能写入小程序代码。
 */
var couponConfig = require('./coupon-config.js');

var CACHE_PREFIX = 'meituan-link:';
var CACHE_TTL = 24 * 60 * 60 * 1000;

function getApiUrl() {
  return couponConfig.meituan && couponConfig.meituan.linkApiUrl;
}

function getCacheKey(activityId) {
  return CACHE_PREFIX + activityId;
}

function readCache(activityId) {
  try {
    var cached = wx.getStorageSync(getCacheKey(activityId));
    if (cached && cached.linkUrl && cached.cachedAt && Date.now() - cached.cachedAt < CACHE_TTL) {
      return cached;
    }
  } catch (error) {
    // 本地缓存不可用时继续请求后端。
  }
  return null;
}

function saveCache(activityId, link) {
  try {
    wx.setStorageSync(getCacheKey(activityId), {
      linkUrl: link.linkUrl,
      copyText: link.copyText || link.linkUrl,
      cachedAt: Date.now()
    });
  } catch (error) {
    // 缓存写入失败不应阻断领券流程。
  }
}

function normalizeResponse(data) {
  var payload = data && data.data ? data.data : data;
  if (!payload || !payload.link_url && !payload.linkUrl) {
    return null;
  }
  return {
    linkUrl: payload.link_url || payload.linkUrl,
    copyText: payload.copy_text || payload.copyText || payload.link_url || payload.linkUrl,
    expireTime: payload.expire_time || payload.expireTime || ''
  };
}

function getLatestLink(coupon, callbacks) {
  callbacks = callbacks || {};
  var activityId = coupon && coupon.activityId;
  var cached = activityId && readCache(activityId);
  if (cached) {
    if (callbacks.success) callbacks.success(cached, true);
    return;
  }

  var apiUrl = getApiUrl();
  if (!apiUrl || !activityId) {
    if (callbacks.fallback) callbacks.fallback(coupon);
    return;
  }

  wx.request({
    url: apiUrl,
    method: 'GET',
    data: { activity_id: activityId },
    success: function(response) {
      var link = normalizeResponse(response.data);
      if (!link) {
        if (callbacks.fallback) callbacks.fallback(coupon);
        return;
      }
      saveCache(activityId, link);
      if (callbacks.success) callbacks.success(link, false);
    },
    fail: function() {
      if (callbacks.fallback) callbacks.fallback(coupon);
    }
  });
}

module.exports = {
  getLatestLink: getLatestLink
};
