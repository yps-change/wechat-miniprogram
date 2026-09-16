/**
 * 外卖券推广链接配置。
 * copyText 可配置平台提供的淘口令/短链接；未配置时默认复制 url。
 * 复制后需由用户切换到对应 App，再粘贴到搜索框或识别入口。
 *
 * 美团 activityId 需与后端 meituan_links 表中的活动标识一致。
 */
module.exports = {
  // 填写你自己的业务后端地址；不要在小程序中配置美团 AppKey/AppSecret。
  // 如需从小程序直接跳转美团小程序，补充已获授权的 appId 和页面 path。
  meituan: {
    linkApiUrl: '',
    appId: '',
    path: ''
  },
  platforms: [
    {
      id: 'taobao-flash',
      name: '淘宝闪购',
      emoji: '🟧',
      accentColor: '#FF6A00',
      coupons: [
        {
          title: '最高抢66元大红包｜红包集合页',
          description: '最全活动会场，最高可抢66元大红包',
          actionLabel: '复制淘口令',
          appName: '淘宝 App',
          url: '',
          copyText: '￥1yBjT8wap4O￥/ HU7405',
          copySuccessMessage: '淘口令已复制！请打开淘宝 App，粘贴到搜索框识别红包。',
          image: '/images/淘宝_超值红包组合.jpg'
        },
        {
          title: '最高22元叠加红包',
          description: '最高22元，可与其他优惠叠加',
          actionLabel: '复制淘口令',
          appName: '淘宝 App',
          url: '',
          copyText: '￥doipT8EC7rc￥/ HU7405',
          copySuccessMessage: '淘口令已复制！请打开淘宝 App，粘贴到搜索框识别红包。',
          image: '/images/淘宝_闪购品牌日.jpg'
        },
        {
          title: '消费日专享',
          description: '城市通用消费红包',
          actionLabel: '复制淘口令',
          appName: '淘宝 App',
          url: '',
          copyText: '￥y5WrT8wg8Df￥/ HU7405',
          copySuccessMessage: '淘口令已复制！请打开淘宝 App，粘贴到搜索框识别红包。',
          image: '/images/淘宝_通用消费.jpg'
        },
        {
          title: '闪购大额满减红包',
          description: '闪购专享大额满减红包',
          actionLabel: '复制淘口令',
          appName: '淘宝 App',
          url: '',
          copyText: '￥dUAHT8wQQmc￥/ HU7405, HT8',
          copySuccessMessage: '淘口令已复制！请打开淘宝 App，粘贴到搜索框识别红包。',
          image: '/images/淘宝_免单.jpg'
        }
      ]
    },
    {
      id: 'meituan',
      name: '美团外卖',
      emoji: '🟡',
      accentColor: '#F5A623',
      coupons: [
        {
          title: '美团外卖节',
          activityId: 'meituan-food-festival',
          description: '点我领取大额红包',
          actionLabel: '复制口令领红包',
          appName: '美团 App',
          url: 'http://dpurl.cn/7fAACdmz',
          copyText: '美团外卖节\n点我领取大额红包\n【下单链接】http://dpurl.cn/NmanNEjz\n【团口令】1来美团，吃得更好，生活更好❤️复制整条信息，打开👉美团👈 http:/💰pnNDVhODM3Yjg💰',
          copySuccessMessage: '复制成功！请打开【美团App】，系统将自动识别并弹出活动页面。',
          image: '/images/外卖节.jpg'
        },
        {
          title: '吃喝玩乐 每日福利',
          activityId: 'meituan-food-entertainment-daily',
          description: '内部优惠3折起，每周五还可抢大额神券',
          actionLabel: '复制口令领红包',
          appName: '美团 App',
          url: 'http://dpurl.cn/XVTPeKwz',
          copyText: '吃喝玩乐 每日福利\n内部优惠3折起 每周五还可抢大额神券\n【下单链接】http://dpurl.cn/dPT4BrVz\n【团口令】1来美团，吃得更好，生活更好❤️复制整条信息，打开👉美团👈 http:/💰wcYzIyNjU5ZDI💰',
          copySuccessMessage: '复制成功！请打开【美团App】，系统将自动识别并弹出活动页面。',
          image: '/images/吃喝玩乐.jpg'
        },
        {
          title: '甄选好店 优惠专享',
          activityId: 'meituan-selected-stores',
          description: '专享甄选好店大额红包',
          actionLabel: '复制口令领红包',
          appName: '美团 App',
          url: 'http://dpurl.cn/QsFpJt3z',
          copyText: '甄选好店 优惠专享\n专享甄选好店大额红包\n【下单链接】http://dpurl.cn/icjVStUz\n【团口令】1来美团，吃得更好，生活更好❤️复制整条信息，打开👉美团👈 http:/💰0lZmE2M2RhMDQ💰',
          copySuccessMessage: '复制成功！请打开【美团App】，系统将自动识别并弹出活动页面。',
          image: '/images/甄选好店.jpg'
        },
        {
          title: '大牌饮品商品券会场',
          activityId: 'meituan-drink-coupon-mall',
          description: '天天好品味蕾不重样，大牌外卖省到爆！',
          actionLabel: '复制口令领红包',
          appName: '美团 App',
          url: 'http://dpurl.cn/ix1k4Gjz',
          copyText: '大牌饮品商品券会场\n天天好品味蕾不重样\n\n大牌外卖省到爆！\n【下单链接】http://dpurl.cn/maOasorz\n【团口令】1来美团，吃得更好，生活更好❤️复制整条信息，打开👉美团👈 http:/💰y1NzVkZGY4YmI💰',
          copySuccessMessage: '复制成功！请打开【美团App】，系统将自动识别并弹出活动页面。',
          image: '/images/饮品.jpg'
        }
      ]
    }
  ]
};
