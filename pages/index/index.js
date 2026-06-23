var foodsData = require('../../data/foods.js');
var randomUtil = require('../../utils/random.js');
var shareUtil = require('../../utils/share.js');

// 粒子爆炸颜色主题
var PARTICLE_COLORS = [
  '#FF6B35', '#FF8F65', '#FFB899', // 橙系
  '#FFD700', '#FFA500', '#FF4500', // 金红系
  '#00CED1', '#20B2AA', '#48D1CC', // 青系
  '#FF69B4', '#FF1493', '#C71585', // 粉系
  '#7B68EE', '#9370DB', '#BA55D3', // 紫系
  '#00FA9A', '#3CB371', '#2E8B57'  // 绿系
];

Page({
  data: {
    currentFood: {},
    isFlipped: false,
    shaking: false
  },

  // 粒子系统变量
  particles: [],
  canvas: null,
  ctx: null,
  animating: false,
  canvasWidth: 0,
  canvasHeight: 0,

  onLoad: function() {
    // 页面加载
  },

  onReady: function() {
    this.initCanvas();
  },

  // 初始化 Canvas
  initCanvas: function() {
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
        
        that.canvas = canvas;
        that.ctx = ctx;
        that.canvasWidth = res[0].width;
        that.canvasHeight = res[0].height;
      });
  },

  // 页面触摸事件 - 触发粒子爆炸
  onPageTouch: function(e) {
    var touch = e.touches[0];
    if (!touch || !this.ctx) return;
    this.createExplosion(touch.clientX, touch.clientY);
  },

  // 创建爆炸粒子
  createExplosion: function(x, y) {
    var count = 30 + Math.floor(Math.random() * 20); // 30-50个粒子
    
    for (var i = 0; i < count; i++) {
      var angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
      var speed = 2 + Math.random() * 6;
      var size = 2 + Math.random() * 8;
      var color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
      var type = Math.random() > 0.5 ? 'circle' : 'ring';
      
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: size,
        color: color,
        alpha: 1,
        decay: 0.015 + Math.random() * 0.02,
        gravity: 0.1 + Math.random() * 0.1,
        friction: 0.96 + Math.random() * 0.03,
        type: type,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      });
    }
    
    // 添加中心光晕
    for (var j = 0; j < 5; j++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: 15 + Math.random() * 15,
        color: '#FFFFFF',
        alpha: 0.8,
        decay: 0.04,
        gravity: 0,
        friction: 0.98,
        type: 'glow',
        rotation: 0,
        rotationSpeed: 0
      });
    }
    
    if (!this.animating) {
      this.animating = true;
      this.animate();
    }
  },

  // 动画循环
  animate: function() {
    var that = this;
    if (!this.ctx || this.particles.length === 0) {
      this.animating = false;
      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      }
      return;
    }
    
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    
    var alive = [];
    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      
      // 更新物理状态
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      p.rotation += p.rotationSpeed;
      
      if (p.alpha <= 0) continue;
      alive.push(p);
      
      // 绘制粒子
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      
      if (p.type === 'circle') {
        // 实心圆
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.fill();
      } else if (p.type === 'ring') {
        // 空心圆环
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        this.ctx.strokeStyle = p.color;
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
      } else if (p.type === 'glow') {
        // 光晕效果
        var gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
      }
      
      this.ctx.restore();
    }
    
    this.particles = alive;
    
    // 使用 requestAnimationFrame
    this.canvas.requestAnimationFrame(function() {
      that.animate();
    });
  },

  // 随机推荐
  onRandomPick: function() {
    var that = this;

    // 如果已经翻开了，先重置卡片再翻新的
    if (this.data.isFlipped) {
      this.setData({ isFlipped: false });
      setTimeout(function() {
        that._doRandomPick();
      }, 300);
    } else {
      this._doRandomPick();
    }
  },

  _doRandomPick: function() {
    var that = this;
    // 触发摇晃动画
    this.setData({ shaking: true });

    setTimeout(function() {
      var food = randomUtil.getRandomOne(foodsData.foods);
      that.setData({
        currentFood: food,
        isFlipped: true,
        shaking: false
      });
    }, 500);
  },

  // 确认选择，存入历史
  onConfirm: function() {
    var food = this.data.currentFood;
    if (!food || !food.id) return;

    // 存入本地历史
    var history = wx.getStorageSync('food_history') || [];
    history.unshift({
      foodId: food.id,
      foodName: food.name,
      emoji: food.emoji,
      timestamp: Date.now(),
      source: 'self'
    });
    // 最多保留50条
    if (history.length > 50) {
      history = history.slice(0, 50);
    }
    wx.setStorageSync('food_history', history);

    wx.showToast({
      title: '今天就吃' + food.name + '！',
      icon: 'none',
      duration: 2000
    });
  },

  // 跳转到候选页
  goToCandidates: function() {
    wx.navigateTo({
      url: '/pages/candidates/candidates'
    });
  },

  // 分享给好友
  onShareAppMessage: function(res) {
    return {
      title: '我选不了了，帮我随机抽一个今天吃什么！',
      path: shareUtil.buildRandomSharePath('好友')
    };
  }
});
