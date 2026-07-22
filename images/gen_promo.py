#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""给小程序实拍截图加推广标题条，生成适合小红书的配图。
用法：python3 gen_promo.py
输出：images/xhs_promo/1_cover.png ... 5_coupon.png
"""
from PIL import Image, ImageDraw, ImageFont
import os

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, 'xhs_promo')
os.makedirs(OUT, exist_ok=True)

CJK = '/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc'
CJK_R = '/usr/share/fonts/opentype/noto/NotoSansCJK-Medium.ttc'
EMOJI = '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf'
SC_INDEX = 2

BLUE = (74, 123, 247)
BLUE_L = (120, 165, 255)
NAVY = (43, 58, 103)
WHITE = (255, 255, 255)
YELLOW = (255, 209, 61)
CREAM = (255, 244, 214)

# 小程序名
APP_NAME = '饭点不纠结-转个饭'

# 5 张截图（缓存路径）与对应文案
SRC_DIR = '/home/yps/.config/Qoder/SharedClientCache/cache/images/3c07adc4'
ITEMS = [
    # (文件名, 输出名, 是否封面, 主标题, 副标题)
    ('7a752ed98310990827a2fe144fd65021-701fe080.jpg', '1_cover.png', True,
     '治好我的选择困难🎯', '打工人中午干饭 0 内耗'),
    ('11935d6d2513962df54ffe9070b94553-0e3543ab.jpg', '2_result.png', False,
     '手一划，命运帮我决定吃啥🎲', None),
    ('78874f9f75a5ff8b327f6fe64be933db-ab4912a7.jpg', '3_menu.png', False,
     '把常点的存成「专属菜单」📝', None),
    ('d4c9e7b7e2f9c4ef51a319ae1fb99766-cbe0ad00.jpg', '4_help.png', False,
     '纠结就甩给同事帮我抽🤝', None),
    ('5adcfd7050cfdbbef80eef67bda54340-ca42d1e3.jpg', '5_coupon.png', False,
     '转完顺手领个外卖红包💰', None),
]


def font(size, bold=True):
    return ImageFont.truetype(CJK if bold else CJK_R, size, index=SC_INDEX)


_ec = {}
def emoji_img(ch, size):
    key = (ch, size)
    if key in _ec:
        return _ec[key]
    f = ImageFont.truetype(EMOJI, 109)
    im = Image.new('RGBA', (140, 140), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((0, 0), ch, font=f, embedded_color=True)
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    s = max(im.size)
    canvas = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    canvas.paste(im, ((s - im.width) // 2, (s - im.height) // 2), im)
    canvas = canvas.resize((size, size), Image.LANCZOS)
    _ec[key] = canvas
    return canvas


def is_emoji(ch):
    o = ord(ch)
    return (0x1F000 <= o <= 0x1FAFF) or (0x2600 <= o <= 0x27BF) or (0x2190 <= o <= 0x21FF)


def tokens(s):
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


def measure(d, s, size, bold=True):
    fnt = font(size, bold)
    total = 0
    for typ, val in tokens(s):
        total += d.textlength(val, font=fnt) if typ == 't' else size
    return total


def draw_center(img, cx, y, s, size, fill, bold=True, stroke=0, stroke_fill=NAVY):
    """图文混排居中：中文用字体，emoji 用彩色图片贴。"""
    d = ImageDraw.Draw(img)
    fnt = font(size, bold)
    total = measure(d, s, size, bold)
    x = cx - total / 2
    for typ, val in tokens(s):
        if typ == 't':
            if stroke:
                d.text((x, y), val, font=fnt, fill=fill,
                       stroke_width=stroke, stroke_fill=stroke_fill)
            else:
                d.text((x, y), val, font=fnt, fill=fill)
            x += d.textlength(val, font=fnt)
        else:
            em = emoji_img(val, size)
            img.paste(em, (int(x), int(y + size * 0.05)), em)
            x += size


def vgradient(w, h, top, bot):
    base = Image.new('RGB', (w, h), top)
    dr = ImageDraw.Draw(base)
    for y in range(h):
        t = y / (h - 1)
        r = int(top[0] + (bot[0] - top[0]) * t)
        g = int(top[1] + (bot[1] - top[1]) * t)
        b = int(top[2] + (bot[2] - top[2]) * t)
        dr.line([(0, y), (w, y)], fill=(r, g, b))
    return base


def process(item):
    fname, out, cover, title, sub = item
    src = Image.open(os.path.join(SRC_DIR, fname)).convert('RGB')
    W, Hs = src.size
    band = int(W * (0.34 if cover else 0.20))
    canvas = Image.new('RGB', (W, Hs + band), WHITE)

    # 顶部渐变标题条
    grad = vgradient(W, band, BLUE_L, BLUE)
    canvas.paste(grad, (0, 0))
    canvas.paste(src, (0, band))

    if cover:
        # 封面：大主标题 + 副标题 + 小程序名徽标
        ts = int(W * 0.088)
        ss = int(W * 0.05)
        ns = int(W * 0.046)
        draw_center(canvas, W / 2, band * 0.16, title, ts, WHITE, stroke=6)
        draw_center(canvas, W / 2, band * 0.16 + ts * 1.35, sub, ss, YELLOW)
        # 小程序名徽标（奶油底圆角）
        d = ImageDraw.Draw(canvas)
        name_txt = '👉 微信搜「' + APP_NAME + '」'
        nw = measure(d, name_txt, ns)
        pad = int(W * 0.03)
        by = band * 0.16 + ts * 1.35 + ss * 1.7
        box = [W / 2 - nw / 2 - pad, by, W / 2 + nw / 2 + pad, by + ns * 1.5]
        d.rounded_rectangle(box, radius=int(ns * 0.75), fill=CREAM)
        draw_center(canvas, W / 2, by + ns * 0.28, name_txt, ns, NAVY)
    else:
        # 内容图：单行标题 + 小程序名副行
        ts = int(W * 0.062)
        ns = int(W * 0.038)
        draw_center(canvas, W / 2, band * 0.24, title, ts, WHITE, stroke=5)
        draw_center(canvas, W / 2, band * 0.24 + ts * 1.35,
                    '小程序「' + APP_NAME + '」', ns, CREAM, bold=False)

    canvas.save(os.path.join(OUT, out), quality=92)
    print('生成', out, canvas.size)


if __name__ == '__main__':
    for it in ITEMS:
        process(it)
    print('全部完成 →', OUT)
