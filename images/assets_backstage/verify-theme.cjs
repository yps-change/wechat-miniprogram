const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert/strict');
const cp = require('child_process');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const app = JSON.parse(read('app.json'));
const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const sourceFiles = ['app.js', 'app.json', ...walk('pages'), ...walk('components'), ...walk('custom-tab-bar'), ...walk('utils'), ...walk('data')];
let checks = 0;
function check(label, fn) { fn(); checks++; console.log('PASS', label); }
check('JS / JSON syntax', () => {
  for (const file of sourceFiles) {
    if (file.endsWith('.js')) new vm.Script(read(file), { filename: file });
    if (file.endsWith('.json')) JSON.parse(read(file));
  }
});
const definitions = {}, cache = {}, storage = {}, timers = new Map();
let now = 1000, timerId = 0, randomValue = 0, navigation;
const fakeDate = class extends Date { static now() { return now; } };
const fakeMath = Object.create(Math); fakeMath.random = () => randomValue;
const wx = {
  getStorageSync: key => storage[key] ?? '', setStorageSync: (key, value) => { storage[key] = value; }, removeStorageSync: key => { delete storage[key]; },
  showToast() {}, showModal(options) { options.success?.({ confirm: true }); }, vibrateShort() {},
  navigateTo({ url }) { navigation = url; }, switchTab({ url }) { navigation = url; }, redirectTo({ url }) { navigation = url; },
  requestSubscribeMessage(options) { options.success?.({}); },
  getSystemInfoSync() { return { pixelRatio: 2 }; }
};
function load(file) {
  file = path.normalize(file);
  if (cache[file]) return cache[file].exports;
  const module = { exports: {} }; cache[file] = module;
  const context = { module, exports: module.exports, wx, console, Date: fakeDate, Math: fakeMath,
    require: relative => load(path.join(path.dirname(file), relative)),
    Page: definition => { definitions[file] = definition; }, Component: definition => { definitions[file] = definition; },
    setTimeout: callback => { timers.set(++timerId, callback); return timerId; }, clearTimeout: id => timers.delete(id)
  };
  vm.runInNewContext(read(file), context, { filename: file }); return module.exports;
}
function page(file) {
  load(file); const definition = definitions[file], instance = { ...definition, ...definition.methods, data: JSON.parse(JSON.stringify(definition.data || {})) };
  instance.setData = patch => Object.assign(instance.data, patch); return instance;
}
function flushTimers() { const pending = [...timers.values()]; timers.clear(); pending.forEach(callback => callback()); }
check('Page routes and component files exist', () => {
  for (const route of app.pages) for (const suffix of ['.js', '.wxml', '.wxss', '.json']) assert(fs.existsSync(path.join(root, route + suffix)), route + suffix);
  for (const file of sourceFiles.filter(file => file.endsWith('.json'))) {
    const json = JSON.parse(read(file));
    for (const component of Object.values(json.usingComponents || {})) {
      const base = component.startsWith('/') ? component.slice(1) : path.join(path.dirname(file), component);
      for (const suffix of ['.js', '.wxml', '.wxss', '.json']) assert(fs.existsSync(path.join(root, base + suffix)), base + suffix);
    }
  }
});
check('WXML events, original business bindings and static assets', () => {
  for (const file of sourceFiles.filter(file => file.endsWith('.wxml'))) {
    const source = read(file), js = file.replace('.wxml', '.js');
    if (fs.existsSync(path.join(root, js))) {
      const instance = page(js);
      for (const match of source.matchAll(/(?:bind|catch):?\w+="([^"]+)"/g)) assert.equal(typeof instance[match[1]], 'function', file + ' ' + match[1]);
    }
    for (const match of source.matchAll(/(?:src|iconPath)="(\/images\/[^"{]+)"/g)) assert(fs.existsSync(path.join(root, match[1].slice(1))), match[1]);
    let old = '';
    try { old = cp.execFileSync('git', ['show', 'HEAD:' + file], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch {}
    const bindings = text => new Set([...text.matchAll(/(?:bind|catch):?\w+="[^"]+"|open-type="share"|data-[\w-]+="[^"]+"/g)].map(match => match[0]));
    const current = bindings(source);
    for (const binding of bindings(old)) {
      if (file === 'pages/index/index.wxml' && binding === 'bindtouchstart="onPageTouch"') continue;
      assert(current.has(binding), file + ' lost ' + binding);
    }
  }
});
const foods = load('data/foods.js').foods;
check('Food artwork covers library, history and unknown food', () => {
  const art = load('utils/food-art.js');
  for (const food of [...foods, {}, { name: '自定义菜', category: 'custom' }, { emoji: foods[0].emoji }]) assert(fs.existsSync(path.join(root, art.getFoodArt(food))), art.getFoodArt(food));
  assert.equal(art.getFoodArt({}), '/images/theme/food-default.png');
});
check('Wheel 1–8 slots: every target aligns to pointer and navigation', () => {
  for (let slots = 1; slots <= 8; slots++) for (let target = 0; target < slots; target++) {
    const instance = page('pages/index/index.js');
    const choices = foods.slice(0, slots); instance.wheelFoods = choices;
    instance.getFoodPool = () => choices; instance.pickWheelFoods = () => {};
    instance.wheelCtx = {}; instance.drawWheel = () => {};
    let frame; instance.wheelCanvas = { requestAnimationFrame(fn) { frame = fn; return 1; }, cancelAnimationFrame() { frame = null; } };
    randomValue = (target + .1) / slots;
    instance.onSpin(); assert(instance.data.spinning);
    const combo = instance.data.comboCount; instance.onSpin(); assert.equal(instance.data.comboCount, combo);
    now += 6000; frame();
    const angle = (instance.currentAngle + (2 * Math.PI / slots) * target) % (2 * Math.PI);
    assert(Math.min(angle, 2 * Math.PI - angle) < 1e-9, slots + ':' + target);
    assert(instance.data.spinning); flushTimers(); assert(!instance.data.spinning);
    assert.equal(navigation, '/pages/result/result?id=' + choices[target].id);
  }
});
check('Wheel drawing supports 1–8 slots, long labels and cancellation', () => {
  for (let count = 1; count <= 8; count++) {
    const instance = page('pages/index/index.js');
    const labels = [];
    instance.wheelWidth = 217; instance.wheelHeight = 217;
    instance.wheelFoods = Array.from({ length: count }, () => ({ name: '超长自定义菜名配时蔬杂粮饭反复测试' }));
    instance.getFoodImage = () => null;
    instance.wheelCtx = new Proxy({ measureText: text => ({ width: text.length * 10 }), fillText: text => labels.push(text) }, { get(target, key) { return target[key] || (() => {}); } });
    instance.drawWheel(2.8); assert.equal(labels.length, count + 2); labels.slice(0, count).forEach(label => assert(label.endsWith('…')));
    assert.deepEqual(labels.slice(count), ['开饭', 'LET’S EAT']);
    let cancelled = false; instance.wheelCanvas = { cancelAnimationFrame() { cancelled = true; } }; instance.spinAnimId = 1; instance.data.spinning = true;
    instance.resultTimer = ++timerId; timers.set(instance.resultTimer, () => assert.fail('Cancelled spin navigated'));
    instance.onHide(); assert(cancelled); assert(!instance.data.spinning); flushTimers();
  }
});
check('Resize stops rotation and reinitializes canvas; center stays circular', () => {
  const instance = page('pages/index/index.js');
  const calls = [];
  instance.stopSpin = () => calls.push('stop'); instance.initWheelCanvas = () => calls.push('resize');
  instance.onResize(); assert.deepEqual(calls, ['stop', 'resize']);
  for (const size of [186, 206, 290, 302]) {
    const arcs = [];
    instance.wheelWidth = size; instance.wheelHeight = size; instance.wheelFoods = foods.slice(0, 8);
    instance.getFoodImage = () => null;
    instance.wheelCtx = new Proxy({ arc: (...args) => arcs.push(args), measureText: text => ({ width: text.length * 10 }) }, { get(target, key) { return target[key] || (() => {}); } });
    instance.drawWheel(0);
    const center = arcs.find(args => args[0] === size / 2 && args[1] === size / 2);
    assert(center); assert.equal(center[2], (size / 2 - 2) * .22);
  }
});
check('Menu add, duplicate, toggle, delete and history generation', () => {
  const instance = page('pages/menu/menu.js'); instance.loadCustomMenu();
  instance.onMenuInput({ detail: { value: '  测试菜  ' } }); instance.addMenuItem(); assert.equal(instance.data.customMenu[0], '测试菜');
  instance.onMenuInput({ detail: { value: '测试菜' } }); instance.addMenuItem(); assert.equal(instance.data.customMenu.length, 1);
  instance.removeMenuItem({ currentTarget: { dataset: { index: 0 } } }); assert(!instance.data.useCustomMenu);
  instance.toggleCustomMenu({ detail: { value: true } }); assert(!instance.data.useCustomMenu);
  storage.food_history = [{ foodName: '饺子' }, { foodName: '饺子' }, { foodName: '牛肉面' }]; instance.generateMenuFromHistory(); assert.equal(instance.data.customMenu.length, 2);
  delete storage.custom_food_menu; delete storage.use_custom_food_menu; delete storage.food_history;
});
check('Friend recommendation submit, share round-trip, author and deduplication', () => {
  const file = 'pages/help-choose/help-choose.js';
  const sender = page(file); sender.onLoad({ mode: 'recommend', sessionId: 'test-share' });
  sender.onRecommendationInput({ detail: { value: '番茄牛腩饭' } }); sender.onRecommenderNameInput({ detail: { value: '饭友' } }); sender.onRecommendMsgInput({ detail: { value: '记得吃饭' } }); sender.submitRecommendation();
  assert(sender.data.submitted); const shared = sender.onShareAppMessage(); const options = Object.fromEntries(new URLSearchParams(shared.path.split('?')[1]));
  assert.equal(options.mode, 'received'); assert.equal(options.msg, '记得吃饭');
  const author = page(file); author.onLoad(options); assert(author.data.isAuthor);
  delete storage['my_recommendation_test-share'];
  const receiver = page(file); receiver.onLoad(options); assert(!receiver.data.isAuthor); receiver.addRecommendationToHistory(); receiver.addRecommendationToHistory();
  assert.equal(storage.food_history.length, 1); assert.equal(storage.food_history[0].foodName, '番茄牛腩饭'); assert.equal(navigation, '/pages/history/history');
});
check('Match score, return share and rematch retain both dishes', () => {
  const instance = page('pages/match/match.js'); instance.onLoad({ food: encodeURIComponent(foods[0].name) });
  assert.equal(instance.calcMatch(foods[0], foods[0]).score, 100);
  instance.onSpin(); flushTimers(); assert(instance.data.tested);
  const shared = instance.onShareAppMessage(); const options = Object.fromEntries(new URLSearchParams(shared.path.split('?')[1]));
  const receiver = page('pages/match/match.js'); receiver.onLoad(options); assert(receiver.data.resultView); assert.equal(receiver.data.inviterFood.name, instance.data.inviterFood.name); assert.equal(receiver.data.myFood.name, instance.data.myFood.name);
  const otherFood = receiver.data.myFood.name; receiver.onRematch(); assert.equal(receiver.data.inviterFood.name, otherFood); assert(!receiver.data.tested); assert(!receiver.data.resultView);
});
console.log('Completed', checks, 'checks across', app.pages.length, 'pages and', foods.length, 'foods.');
