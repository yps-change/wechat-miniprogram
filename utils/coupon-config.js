/**
 * 外卖券推广链接配置。
 * copyText 可配置平台提供的淘口令/短链接；未配置时默认复制 url。
 * 复制后需由用户切换到对应 App，再粘贴到搜索框或识别入口。
 */
module.exports = {
  platforms: [
    {
      id: 'taobao-flash',
      name: '淘宝闪购',
      emoji: '🟧',
      accentColor: '#FF6A00',
      coupons: [
        {
          title: '淘宝闪购 12 元红包',
          description: '先领取基础红包',
          actionLabel: '复制短链接',
          appName: '淘宝 App',
          url: 'https://a.saier1.cn/ny1k3d'
        },
        {
          title: '淘宝闪购叠加红包',
          description: '再领叠加券，满减更划算',
          actionLabel: '复制短链接',
          appName: '淘宝 App',
          url: 'https://a.saier1.cn/ups3yo'
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
          description: '点我领取大额红包',
          actionLabel: '复制口令领红包',
          appName: '美团 App',
          url: 'http://dpurl.cn/7fAACdmz',
          copyText: '美团外卖节\n点我领取大额红包\n【下单链接】http://dpurl.cn/7fAACdmz\n【团口令】1来美团，吃得更好，生活更好❤️复制整条信息，打开👉美团👈 http:/💰y6ZDllYWNiZTQ💰',
          copySuccessMessage: '复制成功！请打开【美团App】，系统将自动识别并弹出活动页面。'
        },
        {
          title: '吃喝玩乐 每日福利',
          description: '内部优惠3折起，每周五还可抢大额神券',
          actionLabel: '复制口令领红包',
          appName: '美团 App',
          url: 'http://dpurl.cn/XVTPeKwz',
          copyText: '吃喝玩乐 每日福利\n内部优惠3折起 每周五还可抢大额神券\n【下单链接】http://dpurl.cn/XVTPeKwz\n【团口令】1来美团，吃得更好，生活更好❤️复制整条信息，打开👉美团👈 http:/💰4uYWY0YThjOTk💰',
          copySuccessMessage: '复制成功！请打开【美团App】，系统将自动识别并弹出活动页面。'
        },
        {
          title: '甄选好店 优惠专享',
          description: '专享甄选好店大额红包',
          actionLabel: '复制口令领红包',
          appName: '美团 App',
          url: 'http://dpurl.cn/QsFpJt3z',
          copyText: '甄选好店 优惠专享\n专享甄选好店大额红包\n【下单链接】http://dpurl.cn/QsFpJt3z\n【团口令】1来美团，吃得更好，生活更好❤️复制整条信息，打开👉美团👈 http:/💰2tNDJjNWMxZDg💰',
          copySuccessMessage: '复制成功！请打开【美团App】，系统将自动识别并弹出活动页面。'
        },
        {
          title: '大牌饮品商品券会场',
          description: '天天好品味蕾不重样，大牌外卖省到爆！',
          actionLabel: '复制口令领红包',
          appName: '美团 App',
          url: 'http://dpurl.cn/ix1k4Gjz',
          copyText: '大牌饮品商品券会场\n天天好品味蕾不重样\n\n大牌外卖省到爆！\n【下单链接】http://dpurl.cn/ix1k4Gjz\n【团口令】1来美团，吃得更好，生活更好❤️复制整条信息，打开👉美团👈 http:/💰rhNzE2MzkzOGM💰',
          copySuccessMessage: '复制成功！请打开【美团App】，系统将自动识别并弹出活动页面。'
        }
      ]
    }
  ]
};
