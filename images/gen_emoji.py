#!/usr/bin/env python3
"""把菜品用到的 emoji 预渲染成 PNG（按 Unicode 码点命名），供转盘 drawImage 使用。"""
from PIL import Image, ImageFont, ImageDraw
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'emoji')
os.makedirs(OUT, exist_ok=True)

FONT = '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf'
SIZE = 109  # NotoColorEmoji 位图 strike 尺寸

# foods.js 中用到的全部 emoji（去重）
EMOJIS = [
    '🍗', '🌶️', '🍚', '🍖', '🥩', '🥚', '🍲', '🐟', '🍝', '🍔',
    '🥗', '🍕', '🍣', '🍛', '🍜', '🍱', '🍤', '🥘', '🍙', '🌯',
    '🍟', '🥣', '🥟', '🥪', '🥑', '🥛', '🍳', '🍢', '🦆', '🫓',
    '🍽️'  # 兜底默认
]

font = ImageFont.truetype(FONT, size=SIZE)

def codepoint_name(emoji):
    # 取首个码点作为文件名，忽略变体选择符 FE0F
    return format(ord(emoji[0]), 'x')

count = 0
for em in EMOJIS:
    img = Image.new('RGBA', (136, 136), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.text((0, 0), em, font=font, embedded_color=True)
    # 裁剪到内容边界后居中到正方形画布
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    side = max(img.size)
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - img.width) // 2, (side - img.height) // 2), img)
    canvas = canvas.resize((96, 96), Image.LANCZOS)
    name = codepoint_name(em)
    canvas.save(os.path.join(OUT, name + '.png'))
    count += 1
    print('saved', name + '.png', '<-', em)

print('Total', count, 'emoji PNGs generated to', OUT)
