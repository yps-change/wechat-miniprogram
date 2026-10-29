const sources = new Map(), modules = new Map(), definitions = new Map(), files = new Map();
const appState = { globalData: {} }, routeStack = [], activity = [];
const pageRoot = document.querySelector('#mini-page'), tabRoot = document.querySelector('#tabs');
let page, tab, pagePath, pageTemplate, globalCss, pageCss, renderQueued = false, generation = 0;
const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const resolve = (from, relative) => new URL(relative, location.origin + from).pathname;
const fetchText = async path => {
  if (!files.has(path)) files.set(path, fetch(path).then(response => { if (!response.ok) throw new Error(path + ': HTTP ' + response.status); return response.text(); }));
  return files.get(path);
};
function log(message) {
  activity.unshift(message); activity.length = Math.min(activity.length, 12);
  parent.postMessage({ activity: activity.join('\n\n'), route: pagePath }, location.origin);
}
function toast(title) {
  document.querySelector('#preview-toast')?.remove();
  const el = document.createElement('div'); el.id = 'preview-toast'; el.textContent = title; document.body.append(el);
  setTimeout(() => el.remove(), 2200); log(title);
}
function modal(options) {
  const dialog = document.createElement('dialog'), title = document.createElement('strong'), body = document.createElement('p');
  title.textContent = options.title; body.textContent = options.content;
  dialog.append(title, body);
  const finish = confirmed => { dialog.close(); dialog.remove(); options.success?.({ confirm: confirmed, cancel: !confirmed }); };
  if (options.showCancel !== false) { const cancel = document.createElement('button'); cancel.textContent = '取消'; cancel.onclick = () => finish(false); dialog.append(cancel); }
  const confirm = document.createElement('button'); confirm.textContent = options.confirmText || '确认'; confirm.onclick = () => finish(true); dialog.append(confirm);
  dialog.oncancel = event => { event.preventDefault(); finish(false); };
  document.body.append(dialog); dialog.showModal(); log(options.title);
}
const wx = window.wx = {
  getStorageSync(key) { const value = localStorage.getItem('food-preview:' + key); return value === null ? '' : JSON.parse(value); },
  setStorageSync(key, value) { localStorage.setItem('food-preview:' + key, JSON.stringify(value)); },
  removeStorageSync(key) { localStorage.removeItem('food-preview:' + key); },
  getSystemInfoSync() { return { pixelRatio: window.devicePixelRatio || 2, windowWidth: innerWidth, platform: 'browser-preview' }; },
  showToast({ title }) { toast(title); }, showModal: modal,
  navigateTo({ url }) { log('模拟 navigateTo ' + url); routeStack.push(pagePath); return navigate(url); },
  switchTab({ url }) { log('模拟 switchTab ' + url); routeStack.length = 0; return navigate(url); },
  redirectTo({ url }) { log('模拟 redirectTo ' + url); return navigate(url); },
  navigateBack() { return navigate(routeStack.pop() || '/pages/index/index'); },
  vibrateShort() {},
  setClipboardData(options) { window.preview.clipboard = options.data; log('模拟复制（未写入系统剪贴板）'); options.success?.({}); },
  requestSubscribeMessage(options) { log('模拟订阅请求（未申请微信权限）'); options.success?.(Object.fromEntries(options.tmplIds.map(id => [id, 'filter']))); },
  request(options) { log('已阻止真实网络请求'); options.fail?.({ errMsg: '浏览器预览不请求外部接口' }); },
  getSetting(options) { options.success?.({ authSetting: {} }); },
  chooseLocation(options) { toast('定位仅可在微信环境验收'); options.fail?.({ errMsg: 'chooseLocation:fail cancel' }); },
  getLocation(options) { options.fail?.({ errMsg: 'getLocation:fail preview' }); },
  openLocation(options) { modal({ title: '模拟地图导航', content: options.name + '\n' + options.address, showCancel: false }); },
  createSelectorQuery() {
    let selector;
    const query = { select(value) { selector = value; return query; }, fields() { return query; }, exec(callback) {
      const canvas = document.querySelector(selector);
      if (!canvas) return callback([]);
      canvas.createImage = () => new Image(); canvas.requestAnimationFrame = requestAnimationFrame.bind(window); canvas.cancelAnimationFrame = cancelAnimationFrame.bind(window);
      callback([{ node: canvas, width: canvas.clientWidth, height: canvas.clientHeight }]);
    } };
    return query;
  }
};
async function preload(path) {
  if (sources.has(path)) return;
  const code = await fetchText(path); sources.set(path, code);
  await Promise.all([...code.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map(match => preload(resolve(path, match[1]))));
}
function requireModule(path) {
  if (modules.has(path)) return modules.get(path).exports;
  const module = { exports: {} }; modules.set(path, module);
  new Function('require', 'module', 'exports', 'Page', 'Component', 'wx', 'getApp', 'getCurrentPages', sources.get(path))(
    relative => requireModule(resolve(path, relative)), module, module.exports,
    definition => definitions.set(path, definition), definition => definitions.set(path, definition), wx,
    () => appState, () => [page]
  );
  return module.exports;
}
function setFields(target, patch) {
  for (const [key, value] of Object.entries(patch)) {
    const parts = key.replace(/\[(\d+)\]/g, '.$1').split('.'); let cursor = target;
    for (const part of parts.slice(0, -1)) cursor = cursor[part] || (cursor[part] = {});
    cursor[parts.at(-1)] = value;
  }
}
function instance(definition, update) {
  const result = Object.assign({}, definition, definition.methods || {});
  result.data = clone(definition.data || {});
  result.setData = (patch, callback) => { setFields(result.data, patch); update?.(); callback?.(); };
  return result;
}
function css(source) {
  return source.replace(/(-?\d*\.?\d+)rpx/g, (_, n) => (+n * innerWidth / 750) + 'px')
    .replace(/(^|[\s,>+~])page(?=\s*\{)/gm, '$1wx-page')
    .replace(/(^|[\s,>+~])view(?=[\s,.#:{>+~])/gm, '$1wx-view')
    .replace(/(^|[\s,>+~])text(?=[\s,.#:{>+~])/gm, '$1wx-text')
    .replace(/(^|[\s,>+~])image(?=[\s,.#:{>+~])/gm, '$1img');
}
function template(source) {
  const el = document.createElement('template');
  el.innerHTML = source.replace(/<([\w-]+)([^>]*?)\s*\/>/g, '<$1$2></$1>');
  return el.content;
}
function expression(value, scope) { return new Function('scope', 'with(scope){return (' + value + ')}')(scope); }
function interpolate(value, scope) {
  const exact = value.match(/^{{([^{}]*)}}$/);
  if (exact) return expression(exact[1], scope);
  return value.replace(/{{([\s\S]*?)}}/g, (_, content) => expression(content, scope) ?? '');
}
const componentPaths = { 'food-illustration': '/components/food-illustration/food-illustration', 'food-card': '/components/food-card/food-card' };
const componentTemplates = {}, componentStyles = {};
function buildChildren(nodes, scope, owner, parentNode) {
  let chain = false;
  for (const node of nodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      parentNode.append(document.createTextNode(interpolate(node.textContent, scope))); continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const loop = node.getAttribute('wx:for');
    if (loop !== null) {
      const values = interpolate(loop, scope) || [];
      values.forEach((item, index) => {
        const childScope = Object.assign({}, scope, { [node.getAttribute('wx:for-item') || 'item']: item, [node.getAttribute('wx:for-index') || 'index']: index });
        const copy = node.cloneNode(true); copy.removeAttribute('wx:for'); buildChildren([copy], childScope, owner, parentNode);
      });
      continue;
    }
    if (node.hasAttribute('wx:if')) {
      chain = !!interpolate(node.getAttribute('wx:if'), scope); if (!chain) continue;
    } else if (node.hasAttribute('wx:elif')) {
      if (chain) continue; chain = !!interpolate(node.getAttribute('wx:elif'), scope); if (!chain) continue;
    } else if (node.hasAttribute('wx:else')) { if (chain) continue; chain = true; }
    else chain = false;
    if (node.tagName.toLowerCase() === 'block') { buildChildren(node.childNodes, scope, owner, parentNode); continue; }
    buildElement(node, scope, owner, parentNode);
  }
}
function buildElement(node, scope, owner, parentNode) {
  const tag = node.tagName.toLowerCase();
  const tagMap = { view: 'wx-view', text: 'wx-text', image: 'img', switch: 'input', map: 'wx-map' };
  const el = document.createElement(tagMap[tag] || tag), props = {}, dataset = {};
  for (const attr of node.attributes) {
    if (attr.name.startsWith('wx:')) continue;
    const value = interpolate(attr.value, scope); props[attr.name] = value;
    if (attr.name.startsWith('bind') || attr.name.startsWith('catch')) { el.setAttribute(attr.name, String(value)); continue; }
    if (attr.name.startsWith('data-')) dataset[attr.name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
    if (['disabled', 'checked', 'hidden'].includes(attr.name)) { if (value) el.setAttribute(attr.name, ''); }
    else if (value !== undefined && value !== null && typeof value !== 'object') el.setAttribute(attr.name, attr.name === 'style' ? css(String(value)) : String(value));
  }
  if (tag === 'image') { if (props.mode === 'widthFix') { el.style.height = 'auto'; el.style.objectFit = 'contain'; } el.alt = ''; }
  if (tag === 'switch') { el.type = 'checkbox'; el.checked = !!props.checked; }
  if (tag === 'input') { el.type = props.type === 'number' ? 'number' : 'text'; el.value = props.value || ''; }
  const eventData = () => ({ currentTarget: { dataset }, target: { dataset }, detail: { value: tag === 'switch' ? el.checked : el.value } });
  for (const [name, method] of Object.entries(props)) {
    if (!/^(bind|catch)/.test(name)) continue;
    const kind = name.replace(/^(bind|catch):?/, ''), event = ({ tap: 'click', confirm: 'keydown' })[kind] || kind;
    el.addEventListener(event, nativeEvent => {
      if (kind === 'confirm' && nativeEvent.key !== 'Enter') return;
      if (name.startsWith('catch')) nativeEvent.stopPropagation();
      owner[method](eventData());
    });
  }
  if (props['open-type'] === 'share') el.addEventListener('click', () => {
    const shared = owner.onShareAppMessage({ from: 'button', target: { dataset } }); window.preview.lastShare = shared;
    modal({ title: '模拟分享卡片', content: shared.title + '\n\n' + shared.path, showCancel: false });
  });
  if (componentPaths[tag]) {
    const path = componentPaths[tag], definition = definitions.get(path + '.js');
    const component = instance(definition);
    for (const [key, setting] of Object.entries(definition.properties || {})) component.data[key] = props[key] ?? clone(setting.value);
    for (const [key, observer] of Object.entries(definition.observers || {})) observer.call(component, component.data[key]);
    const shadow = el.attachShadow({ mode: 'open' });
    const style = document.createElement('style'); style.textContent = css('wx-view{display:block;box-sizing:border-box}wx-text{white-space:pre-wrap}img{object-fit:contain}food-illustration{display:inline-block;line-height:0}' + componentStyles[tag]); shadow.append(style);
    buildChildren(componentTemplates[tag].childNodes, component.data, component, shadow);
  } else if (tag === 'map') el.textContent = '地图占位 · 请在微信内验证位置与导航';
  else buildChildren(node.childNodes, scope, owner, el);
  parentNode.append(el);
}
function render() {
  if (!pageTemplate) return;
  const focused = document.activeElement, focusKey = focused?.getAttribute('bindinput'), selection = focused?.selectionStart;
  const canvas = document.querySelector('#wheelCanvas');
  const fragment = document.createDocumentFragment(); buildChildren(pageTemplate.childNodes, page.data, page, fragment);
  if (canvas && fragment.querySelector('#wheelCanvas')) fragment.querySelector('#wheelCanvas').replaceWith(canvas);
  pageRoot.replaceChildren(fragment);
  if (focusKey) {
    const input = pageRoot.querySelector('[bindinput="' + focusKey + '"]');
    input?.focus({ preventScroll: true }); if (input && selection !== null) input.setSelectionRange(selection, selection);
  }
  renderTabs();
}
function scheduleRender() { if (renderQueued) return; renderQueued = true; queueMicrotask(() => { renderQueued = false; render(); }); }
function renderTabs() {
  tabRoot.replaceChildren();
  if (!['/pages/index/index', '/pages/menu/menu', '/pages/history/history'].includes(pagePath.split('?')[0])) return;
  const fragment = document.createDocumentFragment(); buildChildren(componentTemplates.tab.childNodes, tab.data, tab, fragment); tabRoot.append(fragment);
}
async function navigate(url, patch) {
  const token = ++generation;
  page?.onHide?.(); page?.onUnload?.();
  pageTemplate = null; pageRoot.replaceChildren(); tabRoot.replaceChildren();
  pagePath = url.startsWith('/') ? url : '/' + url;
  const [path, query = ''] = pagePath.split('?');
  const options = Object.fromEntries(query.split('&').filter(Boolean).map(pair => { const i = pair.indexOf('='); return [pair.slice(0, i), pair.slice(i + 1)]; }));
  await preload(path + '.js'); requireModule(path + '.js');
  const [wxml, wxss] = await Promise.all([fetchText(path + '.wxml'), fetchText(path + '.wxss')]);
  if (token !== generation) return;
  const definition = definitions.get(path + '.js'); page = instance(definition, scheduleRender); page.getTabBar = () => tab;
  page.onLoad?.(options); page.onShow?.(); if (patch) page.setData(patch);
  pageTemplate = template(wxml); pageCss = wxss;
  document.querySelector('#actual-styles').textContent = css(globalCss + '\n' + pageCss + '\n' + componentStyles.tab);
  render(); window.scrollTo(0, 0); page.onReady?.(); log('已加载真实页面 ' + pagePath);
}
function scenarios() {
  const foods = requireModule('/data/foods.js').foods, first = foods[0];
  const received = '/pages/help-choose/help-choose?mode=received&recommend=' + encodeURIComponent(first.name) + '&from=' + encodeURIComponent('饭友小林') + '&sessionId=preview-invite&msg=' + encodeURIComponent('工作辛苦啦，今天吃点喜欢的。');
  return {
    index: ['/pages/index/index'], menu: ['/pages/menu/menu'], history: ['/pages/history/history'],
    'menu-long': ['/pages/menu/menu', { customMenu: ['砂锅慢炖番茄牛腩配菌菇杂粮饭超长菜名测试', '工作日的专属美食'], useCustomMenu: true, currentMenuLabel: '专属菜单 · 2 道' }],
    'history-filled': ['/pages/history/history', { historyList: foods.slice(0, 8), groupedHistory: [{ date: '今天', records: foods.slice(0, 5).map((food, i) => ({ foodName: i ? food.name : '招牌砂锅番茄牛腩配时蔬杂粮饭（超长菜名）', emoji: food.emoji, source: i % 2 ? 'friend_recommend' : 'self', fromName: '一起认真吃饭的小伙伴' })) }, { date: '昨天', records: [{ foodName: first.name, emoji: first.emoji, source: 'custom' }] }] }],
    result: ['/pages/result/result?id=' + first.id],
    'result-loading': ['/pages/result/result?id=' + first.id, { nearbyLoading: true }],
    'result-nearby': ['/pages/result/result?id=' + first.id, { nearbyEnabled: true, nearbyList: Array.from({ length: 6 }, (_, i) => ({ rank: i + 1, title: '社区美食 · 招牌家常小馆 ' + (i + 1), address: '美食街道示例地址，仅用于排版测试', distanceText: (i + 1) * 120 + '米', latitude: 30, longitude: 120 })), nearbyNote: '按「美食」为你找了这些附近店铺（模拟数据）', mapLatitude: 30, mapLongitude: 120 }],
    candidates: ['/pages/candidates/candidates'], 'help-random': ['/pages/help-random/help-random?from=' + encodeURIComponent('饭友')],
    'help-choose': ['/pages/help-choose/help-choose?mode=choose&ids=' + foods.slice(0, 4).map(f => f.id).join(',')],
    'help-menu': ['/pages/help-choose/help-choose?mode=menu&names=' + encodeURIComponent('咖喱饭|酸菜鱼|番茄牛腩配杂粮饭（超长专属菜名）')],
    recommend: ['/pages/help-choose/help-choose?mode=recommend&sessionId=preview-compose&names=' + encodeURIComponent('咖喱饭|酸菜鱼|饺子')],
    received: [received], author: [received, { isAuthor: true }],
    match: ['/pages/match/match?food=' + encodeURIComponent(first.name) + '&emoji=' + encodeURIComponent(first.emoji)],
    'match-result': ['/pages/match/match?mode=result&f1=' + encodeURIComponent(first.name) + '&f2=' + encodeURIComponent(foods[1].name) + '&e1=' + encodeURIComponent(first.emoji) + '&e2=' + encodeURIComponent(foods[1].emoji) + '&score=86'],
    'match-invalid': ['/pages/match/match'], coupons: ['/pages/coupons/coupons'],
    'coupon-detail': ['/pages/coupons/coupon-detail/coupon-detail?platformIndex=0&couponIndex=0'],
    'coupon-noimage': ['/pages/coupons/coupon-detail/coupon-detail?platformIndex=0&couponIndex=0', { 'coupon.image': '' }],
    'coupon-loading': ['/pages/coupons/coupon-detail/coupon-detail?platformIndex=0&couponIndex=0', { linkLoading: true }]
  };
}
window.preview = { wx, get page() { return page; }, get path() { return pagePath; }, navigate, back: () => wx.navigateBack(), requireModule,
  async scenario(name) { const args = scenarios()[name]; if (!args) throw new Error('Unknown scenario: ' + name); await navigate(...args); },
  scenarios: () => Object.keys(scenarios()), lastShare: null, clipboard: null, ready: false
};
window.addEventListener('resize', () => {
  if (!pageTemplate) return;
  document.querySelector('#actual-styles').textContent = css(globalCss + '\n' + pageCss + '\n' + componentStyles.tab);
  if (page.initWheelCanvas) { page.stopSpin(); page.wheelCtx = null; pageRoot.replaceChildren(); render(); page.initWheelCanvas(); } else render();
});
(async function start() {
  globalCss = await fetchText('/app.wxss');
  const paths = { ...componentPaths, tab: '/custom-tab-bar/index' };
  await Promise.all(Object.entries(paths).map(async ([tag, path]) => {
    await preload(path + '.js'); requireModule(path + '.js');
    componentTemplates[tag] = template(await fetchText(path + '.wxml')); componentStyles[tag] = await fetchText(path + '.wxss');
  }));
  await preload('/data/foods.js'); requireModule('/data/foods.js');
  tab = instance(definitions.get('/custom-tab-bar/index.js'), renderTabs);
  await window.preview.scenario(new URLSearchParams(location.search).get('scenario') || 'index');
  window.preview.ready = true;
})().catch(error => { console.error(error); toast('预览加载失败：' + error.message); });
