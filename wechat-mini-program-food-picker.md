# 「今天吃什么」微信小程序实现方案

## Context

用户是上班族，每天点外卖不知道吃什么，要做一个帮助快速决策的微信小程序。当前版本功能：随机推荐（转盘 + 抽卡动画）+ 分享给同事帮选/推荐 + 专属菜单 + 历史记录 + 外卖券入口。整体仍为纯前端实现，无后端依赖。

## 项目目录

```
~/wechat-miniprogram/
├── app.js / app.json / app.wxss
├── project.config.json / sitemap.json
├── data/
│   └── foods.js              # 菜品数据库（~80个菜品）
├── utils/
│   ├── random.js             # 随机选取算法
│   ├── share.js              # 分享参数编解码和分享路径构建
│   └── coupon-config.js      # 淘宝闪购/美团外卖券配置
├── pages/
│   ├── index/                # 首页 - 转盘、快速出结果、抽卡弹窗
│   ├── result/               # 结果详情页（保留的独立结果页）
│   ├── candidates/           # 生成3-5个候选菜品
│   ├── help-random/          # 同事帮随机抽（分享落地页）
│   ├── help-choose/          # 同事选择/输入推荐（分享落地页）
│   ├── menu/                 # 专属菜单页
│   ├── coupons/              # 外卖券页
│   └── history/              # 历史记录
├── components/
│   ├── food-card/            # 翻转卡片组件
│   └── candidate-item/       # 候选列表项组件
└── images/                   # 图标资源
```

## 技术方案

- **框架**：微信小程序原生（WXML + WXSS + JS）
- **数据**：纯前端，foods.js 内置 ~80 个菜品；专属菜单、历史记录、同事推荐使用本地 Storage
- **首页核心交互**：2D Canvas 绘制转盘，`requestAnimationFrame` 驱动旋转；快速出结果和转盘均复用当前菜单数据池
- **结果展示**：结果弹窗使用 CSS 3D Transform（rotateY/rotateZ/scale）实现抽卡揭晓，配合金色放射线、星光爆发和 emoji 弹出；结果确认后执行缩小、旋转并飞入历史图标的动画
- **反馈**：结果揭晓和确认时调用 `wx.vibrateShort({ type: 'light' })`
- **分享**：`onShareAppMessage` + URL query 传参；支持 random、choose、menu、recommend 四种模式
- **存储**：`wx.setStorageSync` 保存 `food_history`、`custom_food_menu`、`use_custom_food_menu`、`colleague_recommendation`
- **外卖券**：通过 `utils/coupon-config.js` 配置平台券链接；HTTPS 链接在基础库提供 `wx.openUrl` 时尝试直达，失败后复制；美团小程序/`mp://` 链接复制到剪贴板后由用户粘贴到微信打开
- **限制**：无后端、无联盟 API、无真实券状态同步；当前分享推荐和同事推荐记录主要依赖分享 URL 与本地存储

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

分享均通过 `onShareAppMessage` 的 `path` 参数传递数据：

1. **帮我随机抽**：`/pages/help-random/help-random?mode=random&from=昵称`
2. **帮我从候选选**：`/pages/help-choose/help-choose?mode=choose&ids=3,17,28&from=昵称`
3. **分享专属菜单让同事推荐**：`/pages/help-choose/help-choose?mode=menu&names=菜名1|菜名2&from=昵称`
4. **分享推荐结果**：`/pages/help-choose/help-choose?mode=recommend&recommend=菜名&from=昵称`

接收端 `onLoad(options)` 解析参数。普通候选从本地 foods.js 还原，专属菜单则生成共享菜单项；推荐提交会保存到接收者本地的 `colleague_recommendation`。由于没有后端，目前不能跨设备实时回传推荐记录。

## 卡片翻转动画

- 外容器 `perspective: 1000px`
- 内层 `transform-style: preserve-3d` + `transition: transform 0.6s`
- 正面/背面 `backface-visibility: hidden`，背面预设 `rotateY(180deg)`
- 翻转时给内层加 class `.flipped` → `rotateY(180deg)`

## 当前功能模块

1. 首页 Canvas 转盘、快速出结果、爆发式抽卡结果弹窗
2. 结果轻震动、确认后飞入历史区域动画、历史接收提示
3. 专属菜单页：手动添加/删除、从历史生成、启用/停用、分享给同事推荐
4. 历史记录页：记录来源和接收提示
5. 分享落地页：随机抽取、候选选择、菜单推荐、直接输入推荐
6. 外卖券页：淘宝闪购和美团外卖多条红包链接，支持复制或 HTTPS 直达尝试

## 后续演进建议

1. 若需要真正跨设备接收同事推荐，接入云开发数据库或业务后端，生成带 token 的推荐会话
2. 若需要真正拉起淘宝/美团小程序，补充目标小程序 `appId`、页面路径并评估 `wx.navigateToMiniProgram` 的业务资质和平台限制
3. 接入淘宝/美团联盟 API 前，增加服务端签名、推广参数生成和券有效期校验，不要把密钥放在小程序前端
4. 将 foods.js 和专属菜单迁移到云端，支持团队共享菜单、权限和运营配置

## 验证方式

1. 在微信开发者工具中导入项目，检查编译无报错
2. 点击首页“一键出结果”和“开始转盘”，验证转盘、爆发式抽卡动画和轻震动
3. 点击“🔥 就它了”，验证结果飞入历史图标、历史记录写入和接收提示
4. 在“专属菜单”页添加菜品或从历史生成，验证启用后转盘仅从专属菜单抽取
5. 点击分享按钮，在模拟器中验证 random/choose/menu/recommend 分享路径
6. 通过“编译模式”模拟分享参数打开 help-random / help-choose 页面，验证推荐提交
7. 进入“外卖券”页，验证淘宝 HTTPS 链接直达尝试、美团小程序链接复制和失败兜底提示
8. 验证 `wx.setStorageSync` 对历史、专属菜单和同事推荐数据的读写正常
