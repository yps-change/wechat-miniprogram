/**
 * 轻量日志工具
 *
 * 设计目标：开发时看得清，发布后零负担。
 * - ENABLED 总开关：发布前改成 false，所有日志变“空操作”，性能开销≈0。
 * - LEVEL 级别阈值：只输出 >= 该级别的日志。debug < info < warn < error。
 *   例如线上只想留错误，可设 setLevel('error')。
 *
 * 用法：
 *   var logger = require('../../utils/logger.js');
 *   logger.info('index', 'onLoad');            // [index] onLoad
 *   logger.debug('index', '菜池', { count: 8 }); // [index] 菜池 {count:8}
 *   logger.error('share', '解析失败', err);
 *
 * ⚠️ 注意：
 *   1. 禁止在高频循环里调用（requestAnimationFrame 每帧、drawWheel、animateParticles），会掉帧。
 *   2. 不要在参数里做重计算（如 JSON.stringify 大数组）；直接传对象即可，关掉开关时不会输出。
 */

var LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

// ↓↓↓ 发布前把 ENABLED 改为 false（或 setLevel('error') 只留错误） ↓↓↓
var ENABLED = true;
var LEVEL = 'debug';

function shouldLog(level) {
  return ENABLED && LEVELS[level] >= LEVELS[LEVEL];
}

// 统一加 [tag] 前缀，方便按模块过滤
function output(level, method, tag, args) {
  if (!shouldLog(level)) return;                       // 关闭/低于阈值 → 直接返回，不产生任何输出开销
  var payload = ['[' + tag + ']'].concat(args);
  console[method].apply(console, payload);
}

module.exports = {
  debug: function(tag) {
    output('debug', 'log', tag, Array.prototype.slice.call(arguments, 1));
  },
  info: function(tag) {
    output('info', 'log', tag, Array.prototype.slice.call(arguments, 1));
  },
  warn: function(tag) {
    output('warn', 'warn', tag, Array.prototype.slice.call(arguments, 1));
  },
  error: function(tag) {
    output('error', 'error', tag, Array.prototype.slice.call(arguments, 1));
  },
  // 运行时动态调整（可在 app.js 里按环境设置）
  setEnabled: function(v) { ENABLED = !!v; },
  setLevel: function(l) { if (LEVELS[l]) LEVEL = l; }
};
