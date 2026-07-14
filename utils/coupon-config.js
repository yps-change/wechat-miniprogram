/**
 * 外卖券推广链接配置。
 * 特殊的小程序链接无法由小程序直接打开，因此页面会复制链接，
 * 用户可在微信聊天框或浏览器中粘贴打开。
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
          url: 'https://a.saier1.cn/ny1k3d'
        },
        {
          title: '淘宝闪购叠加红包',
          description: '再领叠加券，满减更划算',
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
          title: '美团通用大红包',
          description: '日常外卖通用红包',
          url: '#小程序://美团丨外卖团购特价美食酒店电影/aVpoqpOSMDR75Mo'
        },
        {
          title: '美团外卖叠加券',
          description: '可与通用红包叠加领取',
          url: 'mp://dvJbx2mY8HMjgMH'
        },
        {
          title: '美团甄选外卖大红包',
          description: '加码领取更多优惠',
          url: '#小程序://美团丨外卖团购特价美食酒店电影/bOTBa4hWAQaHUSE'
        }
      ]
    }
  ]
};
