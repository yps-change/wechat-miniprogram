/**
 * 外卖券推广链接配置。
 *
 * 将 url 替换为已申请的淘宝闪购或美团联盟推广链接后，页面即可直接跳转。
 * 空链接会显示“链接待配置”，避免误跳转到无效地址。
 */
module.exports = {
  platforms: [
    {
      id: 'taobao-flash',
      name: '淘宝闪购',
      emoji: '🟧',
      description: '领取淘宝闪购专属外卖券',
      accentColor: '#FF6A00',
      url: ''
    },
    {
      id: 'meituan',
      name: '美团外卖',
      emoji: '🟡',
      description: '领取美团外卖优惠券',
      accentColor: '#F5A623',
      url: ''
    }
  ]
};
