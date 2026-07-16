var foodsData = require('../../data/foods.js');
var randomUtil = require('../../utils/random.js');
var shareUtil = require('../../utils/share.js');

// 转盘扇区颜色（高对比度、明亮清晰）
var WHEEL_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7',
  '#FF8A5C', '#A8E6CF', '#F38181', '#45B7D1'
];

// 扇区文字颜色（与背景形成高对比）
var WHEEL_TEXT_COLORS = [
  '#FFFFFF', '#2D3436', '#2D3436', '#FFFFFF',
  '#FFFFFF', '#2D3436', '#FFFFFF', '#FFFFFF'
];

// 粒子爆炸颜色（蓝色系+彩色）
var PARTICLE_COLORS = [
  '#4A7BF7', '#6C9BFF', '#A8C4FF',
  '#FFD700', '#FFA500', '#FF6B6B',
  '#00CED1', '#20B2AA', '#48D1CC',
  '#FF69B4', '#FF1493', '#C71585',
  '#7B68EE', '#9370DB', '#BA55D3',
  '#00FA9A', '#3CB371', '#2E8B57'
];

// 标签名映射
var TAG_NAMES = {
  spicy: '辣', mild: '清淡', heavy: '重口味',
  sweet: '偏甜', sour: '酸爽', fresh: '鲜美', custom: '专属'
};

// 转盘上展示的菜品数
var WHEEL_SLOTS = 8;

function normalizeCustomFood(name, index) {
  var cleanName = (name || '').trim();
  return {
    id: 'custom_' + cleanName + '_' + index,
    name: cleanName,
    category: 'custom',
    categoryName: '专属菜单',
    tags: ['custom'],
    priceRange: '自定',
    priceLevel: 1,
    emoji: '🍽️',
    isCustom: true
  };
}

Page({
  data: {
    currentFood: {},
    showResult: false,
    spinning: false,
    lightOn: true,
    comboCount: 0,
    tagNames: TAG_NAMES,
    absorbingResult: false,
    historyPulse: false,
    customMenu: [],
    useCustomMenu: false
  },

  // 转盘状态
  wheelCanvas: null,
  wheelCtx: null,
  wheelWidth: 0,
  wheelHeight: 0,
  wheelFoods: [],
  currentAngle: 0,
  targetAngle: 0,
  spinSpeed: 0,
  spinAnimId: null,

  // 粒子状态
  particles: [],
  particleCanvas: null,
  particleCtx: null,
  particleAnimating: false,
  particleWidth: 0,
  particleHeight: 0,

  // 灯光定时器
  lightTimer: null,

  onLoad: function() {
    this.loadCustomMenu();
  },

  onShow: function() {
    this.loadCustomMenu();
  },

  onReady: function() {
    this.initWheelCanvas();
    this.initParticleCanvas();
    this.pickWheelFoods();
    this.startLightBlink();
  },

  onUnload: function() {
    if (this.lightTimer) clearInterval(this.lightTimer);
  },

  getFoodPool: function() {
    if (this.data.useCustomMenu && this.data.customMenu.length > 0) {
      return this.data.customMenu;
    }
    return foodsData.foods;
  },

  loadCustomMenu: function() {
    var rawMenu = wx.getStorageSync('custom_food_menu') || [];
    var customMenu = rawMenu.map(function(name, index) {
      return normalizeCustomFood(name, index);
    });
    var useCustomMenu = wx.getStorageSync('use_custom_food_menu');
    useCustomMenu = useCustomMenu === '' ? customMenu.length > 0 : !!useCustomMenu;
    this.setData({
      customMenu: customMenu,
      useCustomMenu: useCustomMenu && customMenu.length > 0
    });
    if (this.wheelCtx) {
      this.pickWheelFoods();
    }
  },

  // ========== 转盘初始化 ==========
  initWheelCanvas: function() {
    var that = this;
    var query = wx.createSelectorQuery();
    query.select('#wheelCanvas')
      .fields({ node: true, size: true })
      .exec(function(res) {
        if (!res || !res[0] || !res[0].node) return;
        var canvas = res[0].node;
        var ctx = canvas.getContext('2d');
        var sysInfo = wx.getSystemInfoSync();
        var dpr = sysInfo.pixelRatio || 2;
        // 使用 2x DPR 确保高清渲染
        var scale = Math.max(dpr, 2) * 1.5;
        var w = res[0].width;
        var h = res[0].height;
        canvas.width = w * scale;
        canvas.height = h * scale;
        ctx.scale(scale, scale);
        that.wheelCanvas = canvas;
        that.wheelCtx = ctx;
        that.wheelWidth = w;
        that.wheelHeight = h;
        that.drawWheel(0);
      });
  },

  // 选取转盘上的菜品
  pickWheelFoods: function() {
    var pool = this.getFoodPool();
    this.wheelFoods = randomUtil.getRandomMultiple(pool, Math.min(WHEEL_SLOTS, pool.length));
    if (this.wheelCtx) this.drawWheel(this.currentAngle);
  },

  // 获取 emoji 对应的预渲染 PNG（Canvas 2D 不支持彩色 emoji 字体，用图片替代）
  getEmojiImage: function(emoji) {
    if (!this.wheelCanvas) return null;
    var key = (emoji || '🍽️').codePointAt(0).toString(16);
    var cache = this.emojiImages || (this.emojiImages = {});
    var entry = cache[key];
    if (entry) return entry.loaded ? entry.img : null;

    var img = this.wheelCanvas.createImage();
    entry = { img: img, loaded: false };
    cache[key] = entry;
    var that = this;
    img.onload = function() {
      entry.loaded = true;
      that.drawWheel(that.currentAngle);
    };
    img.src = '/images/emoji/' + key + '.png';
    return null;
  },

  // 绘制转盘
  drawWheel: function(angle) {
    var ctx = this.wheelCtx;
    if (!ctx) return;
    var w = this.wheelWidth;
    var h = this.wheelHeight;
    var cx = w / 2;
    var cy = h / 2;
    var radius = Math.min(cx, cy) - 4;
    var slots = this.wheelFoods.length;
    if (slots === 0) return;
    var arc = (Math.PI * 2) / slots;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    for (var i = 0; i < slots; i++) {
      var startAngle = arc * i - Math.PI / 2;
      var endAngle = startAngle + arc;
      var color = WHEEL_COLORS[i % WHEEL_COLORS.length];
      var textColor = WHEEL_TEXT_COLORS[i % WHEEL_TEXT_COLORS.length];

      // 扇区
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // 扇区白色边线
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 文字和emoji
      ctx.save();
      var textAngle = startAngle + arc / 2;
      ctx.rotate(textAngle);

      // 菜名（靠近内侧，清晰可读）
      ctx.font = 'bold 15px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var name = this.wheelFoods[i].name;
      if (name.length > 4) name = name.substring(0, 4) + '..';
      ctx.fillText(name, radius * 0.45, -6);

      // 食物 emoji（外侧）：用预渲染 PNG 绘制，Canvas 不支持彩色 emoji 字体
      var iconX = radius * 0.72;
      var iconY = 2;
      var emojiImg = this.getEmojiImage(this.wheelFoods[i].emoji);
      if (emojiImg) {
        var s = 34;
        ctx.drawImage(emojiImg, iconX - s / 2, iconY - s / 2, s, s);
      }

      ctx.restore();
    }

    // 中心装饰圆：实心白底（遮住底下转盘）+ 深色描边
    var centerRadius = radius * 0.12;
    ctx.beginPath();
    ctx.arc(0, 0, centerRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#2B4F9E';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.restore();

    // 外圈装饰
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#4A7BF7';
    ctx.lineWidth = 4;
    ctx.stroke();
  },

  // ========== 一键出结果 ==========
  onQuickPick: function() {
    if (this.data.spinning) return;
    var food = randomUtil.getRandomOne(this.getFoodPool());
    if (!food) {
      wx.showToast({ title: '先添加专属菜单或切回默认库', icon: 'none' });
      return;
    }
    var combo = this.data.comboCount + 1;
    this.setData({
      comboCount: combo,
      currentFood: food,
      showResult: true,
      absorbingResult: false
    });
    wx.vibrateShort({ type: 'light' });
    this.triggerResultExplosion();
  },

  // ========== 转盘旋转 ==========
  onSpin: function() {
    if (this.data.spinning) return;

    var that = this;
    if (this.getFoodPool().length === 0) {
      wx.showToast({ title: '先添加专属菜单或切回默认库', icon: 'none' });
      return;
    }

    // 重置结果
    if (this.data.showResult) {
      this.setData({ showResult: false });
    }

    // 连击计数
    var combo = this.data.comboCount + 1;
    this.setData({ comboCount: combo, spinning: true });

    // 重新选菜品
    this.pickWheelFoods();

    // 随机目标菜品索引
    var slots = this.wheelFoods.length;
    var targetIndex = Math.floor(Math.random() * slots);

    // 计算目标角度：至少转5圈 + 停在目标扇区中间
    var arc = (Math.PI * 2) / slots;
    var targetSectorAngle = arc * targetIndex + arc / 2;
    // 指针在顶部(12点钟方向 = -π/2), 转盘逆时针旋转
    var minSpins = 5 + Math.floor(Math.random() * 3); // 5-7圈
    var totalRotation = minSpins * Math.PI * 2 + (Math.PI * 2 - targetSectorAngle);

    this.currentAngle = 0;
    this.targetAngle = totalRotation;
    this.spinSpeed = 0;

    var startTime = Date.now();
    var duration = 3500 + Math.random() * 1500; // 3.5-5秒

    var doSpin = function() {
      var elapsed = Date.now() - startTime;
      var progress = Math.min(elapsed / duration, 1);

      // easeOutQuint 减速曲线
      var eased = 1 - Math.pow(1 - progress, 5);
      that.currentAngle = totalRotation * eased;

      that.drawWheel(that.currentAngle);

      if (progress < 1) {
        that.spinAnimId = that.wheelCanvas.requestAnimationFrame(doSpin);
      } else {
        // 旋转结束
        that.setData({ spinning: false });
        var selectedFood = that.wheelFoods[targetIndex];
        that.setData({
          currentFood: selectedFood,
          showResult: true,
          absorbingResult: false
        });
        wx.vibrateShort({ type: 'light' });
        // 触发爆炸特效
        that.triggerResultExplosion();
      }
    };

    this.wheelCanvas.requestAnimationFrame(doSpin);
  },

  // 结果出现时的爆炸特效
  triggerResultExplosion: function() {
    var cx = this.particleWidth / 2;
    var cy = this.particleHeight / 2;
    this.createExplosion(cx, cy, 72);
    // 四周再来几组
    for (var i = 0; i < 4; i++) {
      var x = Math.random() * this.particleWidth;
      var y = Math.random() * this.particleHeight * 0.6 + this.particleHeight * 0.2;
      this.createExplosion(x, y, 20);
    }
  },

  // ========== 灯光闪烁 ==========
  startLightBlink: function() {
    var that = this;
    this.lightTimer = setInterval(function() {
      that.setData({ lightOn: !that.data.lightOn });
    }, 500);
  },

  // ========== 粒子系统 ==========
  initParticleCanvas: function() {
    var that = this;
    var query = wx.createSelectorQuery();
    query.select('#particleCanvas')
      .fields({ node: true, size: true })
      .exec(function(res) {
        if (!res || !res[0] || !res[0].node) return;
        var canvas = res[0].node;
        var ctx = canvas.getContext('2d');
        var dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);
        that.particleCanvas = canvas;
        that.particleCtx = ctx;
        that.particleWidth = res[0].width;
        that.particleHeight = res[0].height;
      });
  },

  onPageTouch: function(e) {
    var touch = e.touches[0];
    if (!touch || !this.particleCtx) return;
    this.createExplosion(touch.clientX, touch.clientY, 25);
  },

  createExplosion: function(x, y, count) {
    for (var i = 0; i < count; i++) {
      var angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
      var speed = 2 + Math.random() * 6;
      var size = 2 + Math.random() * 8;
      var color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
      var type = Math.random() > 0.5 ? 'circle' : 'ring';

      this.particles.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: size, color: color,
        alpha: 1,
        decay: 0.015 + Math.random() * 0.02,
        gravity: 0.1 + Math.random() * 0.1,
        friction: 0.96 + Math.random() * 0.03,
        type: type,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      });
    }

    // 中心光晕
    for (var j = 0; j < 3; j++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: 15 + Math.random() * 15,
        color: '#FFFFFF', alpha: 0.8,
        decay: 0.04, gravity: 0, friction: 0.98,
        type: 'glow', rotation: 0, rotationSpeed: 0
      });
    }

    if (!this.particleAnimating) {
      this.particleAnimating = true;
      this.animateParticles();
    }
  },

  animateParticles: function() {
    var that = this;
    if (!this.particleCtx || this.particles.length === 0) {
      this.particleAnimating = false;
      if (this.particleCtx) {
        this.particleCtx.clearRect(0, 0, this.particleWidth, this.particleHeight);
      }
      return;
    }

    this.particleCtx.clearRect(0, 0, this.particleWidth, this.particleHeight);
    var alive = [];

    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      p.rotation += p.rotationSpeed;
      if (p.alpha <= 0) continue;
      alive.push(p);

      this.particleCtx.save();
      this.particleCtx.globalAlpha = p.alpha;
      this.particleCtx.translate(p.x, p.y);
      this.particleCtx.rotate(p.rotation);

      if (p.type === 'circle') {
        this.particleCtx.beginPath();
        this.particleCtx.arc(0, 0, p.size, 0, Math.PI * 2);
        this.particleCtx.fillStyle = p.color;
        this.particleCtx.fill();
      } else if (p.type === 'ring') {
        this.particleCtx.beginPath();
        this.particleCtx.arc(0, 0, p.size, 0, Math.PI * 2);
        this.particleCtx.strokeStyle = p.color;
        this.particleCtx.lineWidth = 1.5;
        this.particleCtx.stroke();
      } else if (p.type === 'glow') {
        var gradient = this.particleCtx.createRadialGradient(0, 0, 0, 0, 0, p.size);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        this.particleCtx.beginPath();
        this.particleCtx.arc(0, 0, p.size, 0, Math.PI * 2);
        this.particleCtx.fillStyle = gradient;
        this.particleCtx.fill();
      }
      this.particleCtx.restore();
    }

    this.particles = alive;
    this.particleCanvas.requestAnimationFrame(function() {
      that.animateParticles();
    });
  },

  // ========== 关闭结果弹窗 ==========
  dismissResult: function() {
    if (this.data.absorbingResult) return;
    this.setData({ showResult: false });
  },

  // ========== 弹窗内再转一次 ==========
  onSpinAgain: function() {
    this.setData({ showResult: false });
    var that = this;
    setTimeout(function() {
      that.onSpin();
    }, 300);
  },

  // ========== 确认选择 ==========
  onConfirm: function() {
    var food = this.data.currentFood;
    if (!food || !food.id || this.data.absorbingResult) return;

    var history = wx.getStorageSync('food_history') || [];
    history.unshift({
      foodId: food.id,
      foodName: food.name,
      emoji: food.emoji,
      timestamp: Date.now(),
      source: food.isCustom ? 'custom' : 'self'
    });
    if (history.length > 50) history = history.slice(0, 50);
    wx.setStorageSync('food_history', history);

    // 卡片落向右下角历史 Tab 的位置，但不切换页面
    this.setData({ absorbingResult: true });

    var that = this;
    // 卡片抵达底部历史 Tab 的落点时触发一次轻震，并显示按钮脉冲
    setTimeout(function() {
      wx.vibrateShort({ type: 'light' });
      that.setData({ historyPulse: true });
    }, 700);

    setTimeout(function() {
      that.setData({
        showResult: false,
        absorbingResult: false
      });
    }, 820);

    setTimeout(function() {
      that.setData({ historyPulse: false });
    }, 1080);
  },

  goToCandidates: function() {
    wx.navigateTo({ url: '/pages/candidates/candidates' });
  },

  onShareAppMessage: function(res) {
    return {
      title: '我选不了了，帮我随机抽一个今天吃什么！',
      path: shareUtil.buildRandomSharePath('好友')
    };
  },

  goToCoupons: function() {
    wx.navigateTo({ url: '/pages/coupons/coupons' });
  }
});
