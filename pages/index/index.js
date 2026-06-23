var foodsData = require('../../data/foods.js');
var randomUtil = require('../../utils/random.js');
var shareUtil = require('../../utils/share.js');

// 转盘扇区颜色
var WHEEL_COLORS = [
  '#FF6B35', '#FF8C42', '#FFD166', '#06D6A0',
  '#118AB2', '#073B4C', '#EF476F', '#7B68EE',
  '#20B2AA', '#FF69B4', '#FFA500', '#00CED1'
];

// 粒子爆炸颜色
var PARTICLE_COLORS = [
  '#FF6B35', '#FF8F65', '#FFB899',
  '#FFD700', '#FFA500', '#FF4500',
  '#00CED1', '#20B2AA', '#48D1CC',
  '#FF69B4', '#FF1493', '#C71585',
  '#7B68EE', '#9370DB', '#BA55D3',
  '#00FA9A', '#3CB371', '#2E8B57'
];

// 标签名映射
var TAG_NAMES = {
  spicy: '辣', mild: '清淡', heavy: '重口味',
  sweet: '偏甜', sour: '酸爽', fresh: '鲜美'
};

// 转盘上展示的菜品数
var WHEEL_SLOTS = 8;

Page({
  data: {
    currentFood: {},
    showResult: false,
    spinning: false,
    lightOn: true,
    comboCount: 0,
    tagNames: TAG_NAMES
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

  onLoad: function() {},

  onReady: function() {
    this.initWheelCanvas();
    this.initParticleCanvas();
    this.pickWheelFoods();
    this.startLightBlink();
  },

  onUnload: function() {
    if (this.lightTimer) clearInterval(this.lightTimer);
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
        var dpr = wx.getSystemInfoSync().pixelRatio;
        var w = res[0].width;
        var h = res[0].height;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
        that.wheelCanvas = canvas;
        that.wheelCtx = ctx;
        that.wheelWidth = w;
        that.wheelHeight = h;
        that.drawWheel(0);
      });
  },

  // 选取转盘上的菜品
  pickWheelFoods: function() {
    this.wheelFoods = randomUtil.getRandomMultiple(foodsData.foods, WHEEL_SLOTS);
    if (this.wheelCtx) this.drawWheel(this.currentAngle);
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

      // 扇区
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // 扇区边线
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 文字和emoji
      ctx.save();
      var textAngle = startAngle + arc / 2;
      ctx.rotate(textAngle);

      // emoji
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var emoji = this.wheelFoods[i].emoji || '🍽️';
      ctx.fillText(emoji, radius * 0.72, 0);

      // 菜名（截断）
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      var name = this.wheelFoods[i].name;
      if (name.length > 5) name = name.substring(0, 5) + '..';
      ctx.fillText(name, radius * 0.48, 0);

      ctx.restore();
    }

    // 中心圆
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = '#FFF8F0';
    ctx.fill();
    ctx.strokeStyle = '#FF6B35';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 中心文字
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#FF6B35';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('转', 0, 0);

    ctx.restore();

    // 外圈装饰
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#FF6B35';
    ctx.lineWidth = 4;
    ctx.stroke();
  },

  // ========== 转盘旋转 ==========
  onSpin: function() {
    if (this.data.spinning) return;

    var that = this;

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
          showResult: true
        });
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
    this.createExplosion(cx, cy, 60);
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

  // ========== 确认选择 ==========
  onConfirm: function() {
    var food = this.data.currentFood;
    if (!food || !food.id) return;

    var history = wx.getStorageSync('food_history') || [];
    history.unshift({
      foodId: food.id,
      foodName: food.name,
      emoji: food.emoji,
      timestamp: Date.now(),
      source: 'self'
    });
    if (history.length > 50) history = history.slice(0, 50);
    wx.setStorageSync('food_history', history);

    wx.showToast({
      title: '今天就吃' + food.name + '！',
      icon: 'none',
      duration: 2000
    });
  },

  goToCandidates: function() {
    wx.navigateTo({ url: '/pages/candidates/candidates' });
  },

  onShareAppMessage: function(res) {
    return {
      title: '我选不了了，帮我随机抽一个今天吃什么！',
      path: shareUtil.buildRandomSharePath('好友')
    };
  }
});
