/**
 * 结果页趣味文案：毒鸡汤签文 + 炫耀式分享标题
 *
 * 让"晒结果"本身变成传播内容：结果页展示一句随机签文，
 * 分享标题用炫耀式模板，好友看到的是情绪而不是工具。
 */

// 签文池：结果页随机展示一句
var QUIPS = [
  '天意不可违，吃就完了',
  '这是老天爷替你点的单',
  '纠结一小时，不如转盘三秒',
  '今日宜干饭，忌减肥',
  '命里有时终须吃',
  '干饭人的命运，自有转盘安排',
  '别问，问就是缘分',
  '好运就藏在下一顿饭里',
  '吃饱了，才有力气纠结别的',
  '人生大事，吃饭第一',
  '减肥是明天的事，干饭是现在的事',
  '转盘转到的，就是最好的安排'
];

// 炫耀式分享标题模板，{name} 会被替换成菜名
var BOAST_TITLES = [
  '🎉 天意！老天爷让我今天吃「{name}」',
  '🔮 转盘钦定：今天吃「{name}」，不服来转',
  '😋 我今天吃「{name}」，你呢？转一个试试',
  '🎯 三秒告别纠结：今天吃「{name}」！'
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 随机取一句签文
function getQuip() {
  return pick(QUIPS);
}

// 随机生成炫耀式分享标题
function getBoastTitle(name) {
  if (!name) return '🎯 今天吃什么？转一个！';
  return pick(BOAST_TITLES).replace('{name}', name);
}

module.exports = {
  getQuip: getQuip,
  getBoastTitle: getBoastTitle
};
