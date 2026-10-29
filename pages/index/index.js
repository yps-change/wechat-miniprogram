var foodsData = require('../../data/foods.js');
var randomUtil = require('../../utils/random.js');
var shareUtil = require('../../utils/share.js');
var sceneUtil = require('../../utils/scene.js');
var logger = require('../../utils/logger.js');
var foodPool = require('../../utils/food-pool.js');
var foodArt = require('../../utils/food-art.js');

var WHEEL_COLORS = ['#F2DFC7', '#E5E9D6', '#F6E8D7', '#ECEBDC', '#F1D8BD', '#E4E7D2', '#F8ECDA', '#EAE4D1'];
var WHEEL_SLOTS = 8;

Page({
  data: {
    spinning: false,
    comboCount: 0,
    customMenu: [],
    useCustomMenu: false,
    poolLabel: '默认美食库'
  },
  wheelCanvas: null,
  wheelCtx: null,
  wheelWidth: 0,
  wheelHeight: 0,
  wheelFoods: [],
  currentAngle: 0,
  spinAnimId: null,

  onLoad: function() {
    logger.info('index', 'onLoad');
    this.loadCustomMenu();
  },

  onShow: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    this.loadCustomMenu();
  },

  onReady: function() {
    this.pickWheelFoods();
    this.initWheelCanvas();
  },

  onResize: function() {
    this.stopSpin();
    this.initWheelCanvas();
  },

  onHide: function() {
    this.stopSpin();
  },

  onUnload: function() {
    this.stopSpin();
  },

  stopSpin: function() {
    if (this.spinAnimId !== null && this.wheelCanvas) {
      this.wheelCanvas.cancelAnimationFrame(this.spinAnimId);
      this.spinAnimId = null;
    }
    clearTimeout(this.resultTimer);
    if (this.data.spinning) this.setData({ spinning: false });
  },

  getFoodPool: function() {
    return this.data.useCustomMenu && this.data.customMenu.length > 0 ? this.data.customMenu : foodsData.foods;
  },

  loadCustomMenu: function() {
    var rawMenu = wx.getStorageSync('custom_food_menu') || [];
    var customMenu = rawMenu.map(function(name, index) {
      return foodPool.normalizeCustomFood(name, index);
    });
    var useCustomMenu = wx.getStorageSync('use_custom_food_menu');
    useCustomMenu = useCustomMenu === '' ? customMenu.length > 0 : !!useCustomMenu;
    var useCustom = useCustomMenu && customMenu.length > 0;
    this.setData({
      customMenu: customMenu,
      useCustomMenu: useCustom,
      poolLabel: useCustom ? ('专属菜单 · ' + customMenu.length + ' 道') : '默认美食库'
    });
    if (this.wheelCtx) this.pickWheelFoods();
  },

  initWheelCanvas: function() {
    var that = this;
    wx.createSelectorQuery().select('#wheelCanvas').fields({ node: true, size: true }).exec(function(res) {
      if (!res || !res[0] || !res[0].node) return;
      var canvas = res[0].node;
      var ctx = canvas.getContext('2d');
      var scale = Math.max(wx.getSystemInfoSync().pixelRatio || 2, 2);
      var width = res[0].width;
      var height = res[0].height;
      canvas.width = width * scale;
      canvas.height = height * scale;
      ctx.scale(scale, scale);
      that.wheelCanvas = canvas;
      that.wheelCtx = ctx;
      that.wheelWidth = width;
      that.wheelHeight = height;
      that.drawWheel(that.currentAngle);
    });
  },

  pickWheelFoods: function() {
    var pool = this.getFoodPool();
    this.wheelFoods = randomUtil.getRandomMultiple(pool, Math.min(WHEEL_SLOTS, pool.length));
    if (this.wheelCtx) this.drawWheel(this.currentAngle);
  },

  getFoodImage: function(food) {
    if (!this.wheelCanvas) return null;
    var path = foodArt.getFoodArt(food);
    var cache = this.foodImages || (this.foodImages = {});
    var entry = cache[path];
    if (entry) return entry.loaded ? entry.img : null;
    var img = this.wheelCanvas.createImage();
    entry = { img: img, loaded: false };
    cache[path] = entry;
    var that = this;
    img.onload = function() {
      entry.loaded = true;
      that.drawWheel(that.currentAngle);
    };
    img.src = path;
    return null;
  },

  drawWheel: function(angle) {
    var ctx = this.wheelCtx;
    if (!ctx) return;
    var cx = this.wheelWidth / 2;
    var cy = this.wheelHeight / 2;
    var radius = Math.min(cx, cy) - 2;
    var slots = this.wheelFoods.length;
    if (!slots) return;
    var arc = Math.PI * 2 / slots;
    ctx.clearRect(0, 0, this.wheelWidth, this.wheelHeight);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    for (var i = 0; i < slots; i++) {
      var start = arc * i - Math.PI / 2 - arc / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, start, start + arc);
      ctx.closePath();
      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#FAF7EF';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    for (var j = 0; j < slots; j++) {
      var textAngle = arc * j - Math.PI / 2;
      var iconSize = radius * 0.31;
      ctx.save();
      ctx.rotate(textAngle);
      ctx.translate(radius * 0.68, 0);
      ctx.rotate(-textAngle - angle);
      var image = this.getFoodImage(this.wheelFoods[j]);
      if (image) ctx.drawImage(image, -iconSize / 2, -iconSize * 0.64, iconSize, iconSize);
      ctx.font = '500 ' + Math.max(10, Math.round(radius * 0.087)) + 'px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#474439';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var letters = Array.from(this.wheelFoods[j].name);
      var name = letters.join('');
      var width = radius * 0.62;
      while (letters.length > 1 && ctx.measureText(name).width > width) {
        letters.pop();
        name = letters.join('') + '…';
      }
      ctx.fillText(name, 0, iconSize * 0.65);
      ctx.restore();
    }
    ctx.restore();
    // 中心与指针同画布绘制，避免原生 Canvas 遮挡浮层。
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFDF7';
    ctx.fill();
    ctx.strokeStyle = '#D9CBB9';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#474439';
    ctx.font = '500 ' + Math.max(12, Math.round(radius * 0.12)) + 'px "Songti SC", serif';
    ctx.fillText('开饭', cx, cy - radius * 0.025);
    ctx.fillStyle = '#BD4828';
    ctx.font = Math.max(5, Math.round(radius * 0.044)) + 'px Georgia, serif';
    ctx.fillText('LET’S EAT', cx, cy + radius * 0.09);
    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.065, 2);
    ctx.lineTo(cx + radius * 0.065, 2);
    ctx.lineTo(cx, radius * 0.12);
    ctx.closePath();
    ctx.fillStyle = '#BD4828';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, radius * 0.045, radius * 0.015, 0, Math.PI * 2);
    ctx.fillStyle = '#FAF7EF';
    ctx.fill();
    ctx.restore();
  },

  onQuickPick: function() {
    if (this.data.spinning) return;
    var food = randomUtil.getRandomOne(this.getFoodPool());
    if (!food) {
      wx.showToast({ title: '先添加专属菜单或切回默认库', icon: 'none' });
      return;
    }
    this.setData({ comboCount: this.data.comboCount + 1 });
    logger.info('index', '一键出结果=' + food.name);
    wx.vibrateShort({ type: 'light' });
    this.goToResult(food);
  },

  goToResult: function(food) {
    var url = food.isCustom ? '/pages/result/result?name=' + encodeURIComponent(food.name) : '/pages/result/result?id=' + food.id;
    wx.navigateTo({ url: url });
  },

  onSpin: function() {
    if (this.data.spinning || !this.wheelCtx) return;
    if (!this.getFoodPool().length) {
      wx.showToast({ title: '先添加专属菜单或切回默认库', icon: 'none' });
      return;
    }
    var that = this;
    this.setData({ comboCount: this.data.comboCount + 1, spinning: true });
    this.pickWheelFoods();
    var slots = this.wheelFoods.length;
    var targetIndex = Math.floor(Math.random() * slots);
    var arc = Math.PI * 2 / slots;
    var minSpins = 5 + Math.floor(Math.random() * 3);
    var totalRotation = minSpins * Math.PI * 2 + (Math.PI * 2 - arc * targetIndex);
    this.currentAngle = 0;
    var startTime = Date.now();
    var duration = 3500 + Math.random() * 1500;
    function doSpin() {
      var progress = Math.min((Date.now() - startTime) / duration, 1);
      that.currentAngle = totalRotation * (1 - Math.pow(1 - progress, 5));
      that.drawWheel(that.currentAngle);
      if (progress < 1) {
        that.spinAnimId = that.wheelCanvas.requestAnimationFrame(doSpin);
      } else {
        that.spinAnimId = null;
        var selectedFood = that.wheelFoods[targetIndex];
        logger.info('index', '转盘停止，结果=' + selectedFood.name);
        wx.vibrateShort({ type: 'light' });
        that.resultTimer = setTimeout(function() {
          that.setData({ spinning: false });
          that.goToResult(selectedFood);
        }, 200);
      }
    }
    this.spinAnimId = this.wheelCanvas.requestAnimationFrame(doSpin);
  },

  goToCandidates: function() {
    wx.navigateTo({ url: '/pages/candidates/candidates' });
  },

  onShareAppMessage: function() {
    return { title: sceneUtil.getRandomShareTitle(), path: shareUtil.buildRandomSharePath('好友') };
  },

  onShareTimeline: function() {
    return { title: '\uD83C\uDFAF 今天吃什么？让转盘帮你决定！' };
  },

  goToCoupons: function() {
    wx.navigateTo({ url: '/pages/coupons/coupons' });
  },

  goToMenu: function() {
    wx.switchTab({ url: '/pages/menu/menu' });
  }
});
