#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成小红书「笔记1·痛点共鸣型」配图：封面 + 3 张内容图（1080x1440）。"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'xhs')
os.makedirs(OUT, exist_ok=True)

CJK = '/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc'   # 简体粗黑
CJK_R = '/usr/share/fonts/opentype/noto/NotoSansCJK-Medium.ttc'
EMOJI = '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf'
SC_INDEX = 2

W, H = 1080, 1440

# 配色
NAVY = (43, 58, 103)
BLUE = (74, 123, 247)
BLUE_L = (108, 155, 255)
CREAM_TOP = (255, 232, 214)
CREAM_BOT = (255, 247, 237)
WHITE = (255, 255, 255)
GRAY = (120, 130, 150)
RED = (255, 107, 107)
YELLOW = (255, 209, 61)
DARK = (45, 52, 54)


def font(size, bold=True):
    return ImageFont.truetype(CJK if bold else CJK_R, size, index=SC_INDEX)


_emoji_cache = {}
def emoji_img(ch, size):
    key = (ch, size)
    if key in _emoji_cache:
        return _emoji_cache[key]
    f = ImageFont.truetype(EMOJI, 109)
    im = Image.new('RGBA', (140, 140), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.text((0, 0), ch, font=f, embedded_color=True)
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    s = max(im.size)
    canvas = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    canvas.paste(im, ((s - im.width) // 2, (s - im.height) // 2), im)
    canvas = canvas.resize((size, size), Image.LANCZOS)
    _emoji_cache[key] = canvas
    return canvas


def is_emoji(ch):
    o = ord(ch)
    return (0x1F000 <= o <= 0x1FAFF) or (0x2600 <= o <= 0x27BF) or (0x2190 <= o <= 0x21FF)


def _tokens(s):
    res, buf = [], ''
    for ch in s:
        if ch == '\ufe0f':
            continue
        if is_emoji(ch):
            if buf:
                res.append(('t', buf)); buf = ''
            res.append(('e', ch))
        else:
            buf += ch
    if buf:
        res.append(('t', buf))
    return res


def rt(img, cx, y, s, size, fill, bold=True):
    """图文混排居中：中文用 CJK 字体，emoji 用彩色图片贴。"""
    d = ImageDraw.Draw(img)
    fnt = font(size, bold)
    parts, total = [], 0
    for typ, val in _tokens(s):
        if typ == 't':
            w = d.textlength(val, font=fnt)
        else:
            w = size
        parts.append((typ, val, w)); total += w
    x = cx - total / 2
    for typ, val, w in parts:
        if typ == 't':
            d.text((x, y), val, font=fnt, fill=fill)
        else:
            em = emoji_img(val, size)
            img.paste(em, (int(x), int(y + size * 0.05)), em)
        x += w
    return size


def vgradient(w, h, top, bot):
    base = Image.new('RGB', (w, h), top)
    top_r, top_g, top_b = top
    bot_r, bot_g, bot_b = bot
    for y in range(h):
        t = y / (h - 1)
        r = int(top_r + (bot_r - top_r) * t)
        g = int(top_g + (bot_g - top_g) * t)
        b = int(top_b + (bot_b - top_b) * t)
        for x in range(0, w, w):
            pass
        ImageDraw.Draw(base).line([(0, y), (w, y)], fill=(r, g, b))
    return base


def rounded(draw, box, radius, fill):
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def text_w(d, s, fnt):
    b = d.textbbox((0, 0), s, font=fnt)
    return b[2] - b[0]


def draw_center(d, cx, y, s, fnt, fill):
    w = text_w(d, s, fnt)
    d.text((cx - w / 2, y), s, font=fnt, fill=fill)
    b = d.textbbox((0, 0), s, font=fnt)
    return b[3] - b[1]


def paste_emoji(img, ch, size, cx, cy, rot=0):
    em = emoji_img(ch, size)
    if rot:
        em = em.rotate(rot, expand=True, resample=Image.BICUBIC)
    img.paste(em, (int(cx - em.width / 2), int(cy - em.height / 2)), em)


def draw_wheel(img, cx, cy, r):
    """在封面画一个迷你彩色转盘，带食物名字，呼应小程序。"""
    colors = [(255, 107, 107), (78, 205, 196), (255, 209, 61), (108, 92, 231),
              (255, 138, 92), (168, 230, 207), (243, 129, 129), (69, 183, 209)]
    names = ['火锅', '日料', '饺子', '烤鱼',
             '拉面', '炒饭', '汉堡', '烧烤']
    nemoji = ['🍲', '🍣', '🥟', '🐟',
              '🍜', '🍚', '🍔', '🍢']
    layer = Image.new('RGBA', (r * 2 + 20, r * 2 + 20), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ox = oy = r + 10
    n = len(colors)
    for i in range(n):
        a0 = i * 360 / n - 90
        a1 = (i + 1) * 360 / n - 90
        ld.pieslice([ox - r, oy - r, ox + r, oy + r], a0, a1, fill=colors[i])
    # 外圈
    ld.ellipse([ox - r, oy - r, ox + r, oy + r], outline=(74, 123, 247), width=10)
    # 食物 emoji + 名字（emoji 在上、名字在下，白字+深蓝描边）
    import math
    nf = font(int(r * 0.14), bold=True)
    em_size = int(r * 0.20)
    for i in range(n):
        mid = math.radians(i * 360 / n - 90 + 22.5)
        tx = ox + math.cos(mid) * r * 0.62
        ty = oy + math.sin(mid) * r * 0.62
        em = emoji_img(nemoji[i], em_size)
        layer.paste(em, (int(tx - em_size / 2), int(ty - em_size - r * 0.02)), em)
        ld.text((tx, ty + r * 0.10), names[i], font=nf, fill=(255, 255, 255),
                anchor='mm', stroke_width=4, stroke_fill=(43, 58, 103))
    # 中心白圆
    cr = int(r * 0.16)
    ld.ellipse([ox - cr, oy - cr, ox + cr, oy + cr], fill=(255, 255, 255), outline=(43, 79, 158), width=6)
    img.paste(layer, (int(cx - ox), int(cy - oy)), layer)
    # 指针
    d = ImageDraw.Draw(img)
    d.polygon([(cx, cy - r - 6), (cx - 22, cy - r - 44), (cx + 22, cy - r - 44)], fill=(74, 123, 247))


# ============ 图1：封面 ============
def cover():
    img = vgradient(W, H, CREAM_TOP, CREAM_BOT).convert('RGBA')
    d = ImageDraw.Draw(img)

    # 顶部小标签
    tag = '选择困难星人自救指南'
    tf = font(38, bold=True)
    tw = text_w(d, tag, tf)
    pad = 34
    bx0 = (W - tw) / 2 - pad
    rounded(d, [bx0, 92, bx0 + tw + pad * 2, 92 + 74], 37, BLUE)
    d.text(((W - tw) / 2, 104), tag, font=tf, fill=WHITE)

    # 主标题
    big = font(104, bold=True)
    draw_center(d, W / 2, 210, '治好我选择困难的', big, NAVY)
    draw_center(d, W / 2, 340, '干饭神器', big, NAVY)
    # 高亮块在“干饭神器”后
    # 副标题
    sub = font(46, bold=False)
    draw_center(d, W / 2, 486, '中午再也不用纠结吃什么了', sub, GRAY)

    # 中部转盘
    draw_wheel(img, W / 2, 920, 268)

    # 转盘上方的表情
    paste_emoji(img, '😭', 120, 200, 700)
    paste_emoji(img, '🎯', 130, 880, 700, rot=-10)

    # 底部一句话卡片
    d2 = ImageDraw.Draw(img)
    rounded(d2, [90, 1230, W - 90, 1350], 40, WHITE)
    rt(img, W / 2, 1255, '转一转 · 命运帮你选 🍜', 50, BLUE)

    img.convert('RGB').save(os.path.join(OUT, '01_cover.png'))
    print('saved 01_cover.png')


# ============ 通用内容图背景 ============
def content_bg():
    img = vgradient(W, H, (238, 243, 255), (255, 255, 255)).convert('RGBA')
    return img


# ============ 图2：痛点 ============
def slide_pain():
    img = content_bg()
    d = ImageDraw.Draw(img)
    # 序号
    rounded(d, [80, 110, 230, 200], 24, RED)
    d.text((108, 118), '痛点', font=font(56), fill=WHITE)

    paste_emoji(img, '😩', 200, W / 2, 470)

    t = font(78)
    draw_center(d, W / 2, 640, '点外卖翻了半小时', t, NAVY)
    draw_center(d, W / 2, 750, '最后还是饿着关掉', t, NAVY)

    s = font(48, bold=False)
    draw_center(d, W / 2, 900, '“今天吃什么”能纠结整整 40 分钟', s, GRAY)
    draw_center(d, W / 2, 980, '这就是我每天中午的真实写照…', s, GRAY)

    # 底部标签条
    rounded(d, [90, 1180, W - 90, 1300], 40, (255, 235, 235))
    draw_center(d, W / 2, 1205, '#选择困难症 本人狂点头', font(50), RED)

    img.convert('RGB').save(os.path.join(OUT, '02_pain.png'))
    print('saved 02_pain.png')


# ============ 图3：解决方案 ============
def slide_solution():
    img = content_bg()
    d = ImageDraw.Draw(img)
    rounded(d, [80, 110, 260, 200], 24, BLUE)
    d.text((108, 118), '救星', font=font(56), fill=WHITE)

    paste_emoji(img, '🎯', 210, W / 2, 460, rot=-8)

    t = font(80)
    draw_center(d, W / 2, 640, '打开就是美食大转盘', t, NAVY)
    t2 = font(66)
    draw_center(d, W / 2, 770, '手一划 · 转到啥吃啥', t2, BLUE)

    s = font(48, bold=False)
    draw_center(d, W / 2, 900, '命运帮你做决定，绝不反悔', s, GRAY)
    draw_center(d, W / 2, 980, '10 秒搞定今天吃什么', s, GRAY)
    
    rounded(d, [90, 1180, W - 90, 1300], 40, (230, 240, 255))
    rt(img, W / 2, 1205, '干饭 0 内耗，从此不纠结 🙌', 50, BLUE)

    img.convert('RGB').save(os.path.join(OUT, '03_solution.png'))
    print('saved 03_solution.png')


# ============ 图4：卖点清单 ============
def slide_features():
    img = content_bg()
    d = ImageDraw.Draw(img)
    draw_center(d, W / 2, 130, '我最爱的 4 个点', font(78), NAVY)

    items = [
        ('🍜', '80+ 热门外卖', '中餐日料火锅快餐全都有'),
        ('📝', '专属菜单', '把公司楼下常点的存进去'),
        ('🤝', '甩给好友', '“帮我抽一个”，社死又快乐'),
        ('💰', '领外卖红包', '转完顺手领券，省一顿是一顿'),
    ]
    y = 320
    gap = 250
    for em, title, desc in items:
        rounded(d, [70, y, W - 70, y + 200], 44, WHITE)
        paste_emoji(img, em, 130, 200, y + 100)
        d.text((320, y + 42), title, font=font(58), fill=NAVY)
        d.text((320, y + 122), desc, font=font(40, bold=False), fill=GRAY)
        y += gap

    img.convert('RGB').save(os.path.join(OUT, '04_features.png'))
    print('saved 04_features.png')


if __name__ == '__main__':
    cover()
    slide_pain()
    slide_solution()
    slide_features()
    print('全部生成到', OUT)
