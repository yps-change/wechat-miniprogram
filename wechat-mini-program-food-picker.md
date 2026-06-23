# 「今天吃什么」微信小程序实现方案

## Context

用户是上班族，每天点外卖不知道吃什么，要做一个帮助快速决策的微信小程序。第一版 MVP 功能：随机推荐（卡片翻转动画）+ 分享给同事帮选 + 内置菜品数据库。纯前端实现，无后端依赖。

## 项目目录

```
~/wechat-miniprogram/
├── app.js / app.json / app.wxss
├── project.config.json / sitemap.json
├── data/
│   └── foods.js              # 菜品数据库（~80个菜品）
├── utils/
│   ├── random.js             # 随机选取算法
│   └── share.js              # 分享参数编解码
├── pages/
│   ├── index/                # 首页 - 点按钮翻牌推荐
│   ├── result/               # 结果详情页
│   ├── candidates/           # 生成3-5个候选菜品
│   ├── help-random/          # 同事帮随机抽（分享落地页）
│   ├── help-choose/          # 同事从候选里选（分享落地页）
│   └── history/              # 历史记录
├── components/
│   ├── food-card/            # 翻转卡片组件
│   └── candidate-item/       # 候选列表项组件
└── images/                   # 图标资源
```

## 技术方案

- **框架**：微信小程序原生（WXML + WXSS + JS）
- **数据**：纯前端，foods.js 内置 ~80 个菜品
- **动画**：CSS 3D Transform 卡片翻转（rotateY + backface-visibility）
- **分享**：onShareAppMessage + URL query 传参（mode/ids/from）
- **存储**：wx.setStorageSync 保存历史记录

## 数据模型

```js
// data/foods.js 中每个菜品：
{
  id: 1,
  name: "黄焖鸡米饭",
  category: "chinese",       // 分类key
  categoryName: "中餐",      // 分类显示名
  tags: ["heavy"],           // 口味: spicy/mild/heavy/sweet/sour/fresh
  priceRange: "15-25",       // 价格区间
  priceLevel: 1,             // 1便宜 2中等 3偏贵
  emoji: "🍗"               // 展示图标
}
```

分类覆盖：中餐、西餐、日料、韩餐、快餐、面食、粥粉、轻食沙拉、火锅麻辣烫、烧烤

## 分享功能实现

两种玩法均通过 `onShareAppMessage` 的 `path` 参数传递数据：

1. **帮我随机抽**：`/pages/help-random/help-random?mode=random&from=昵称`
2. **帮我从候选选**：`/pages/help-choose/help-choose?mode=choose&ids=3,17,28&from=昵称`

接收端 `onLoad(options)` 解析参数，从本地 foods.js 还原数据。

## 卡片翻转动画

- 外容器 `perspective: 1000px`
- 内层 `transform-style: preserve-3d` + `transition: transform 0.6s`
- 正面/背面 `backface-visibility: hidden`，背面预设 `rotateY(180deg)`
- 翻转时给内层加 class `.flipped` → `rotateY(180deg)`

## 实现步骤

1. 创建项目目录，编写 app.json / app.wxss / project.config.json
2. 编写 data/foods.js 菜品数据库（~80个菜品）
3. 编写 utils/random.js 和 utils/share.js 工具函数
4. 开发 food-card 翻转卡片组件
5. 开发首页 pages/index（核心交互：按钮 → 翻牌 → 展示结果）
6. 开发 pages/result 结果详情页
7. 开发 pages/candidates 候选生成页
8. 开发 pages/help-random 和 pages/help-choose 分享落地页
9. 开发 pages/history 历史记录页
10. 完善 app.js 启动逻辑和分享场景处理

## 验证方式

1. 在微信开发者工具中导入项目，检查编译无报错
2. 点击首页按钮，验证翻转动画和随机推荐正常
3. 点击分享按钮，在模拟器中验证分享路径正确
4. 通过「编译模式」模拟分享参数打开 help-random / help-choose 页面
5. 验证历史记录读写正常
