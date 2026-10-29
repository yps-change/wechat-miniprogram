import copy
import re
import xml.etree.ElementTree as ET
from pathlib import Path

import cairo
import gi

gi.require_version('Rsvg', '2.0')
from gi.repository import Rsvg

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'images' / 'theme'
NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
source = (Path(__file__).parent / 'home-preview.html').read_text()
library = ET.fromstring(re.search(r'<svg class="svg-library".*?</svg>', source, re.S).group())
symbols = {node.get('id'): node for node in library.iter(f'{{{NS}}}symbol')}


def render(name, symbol, size, color=None):
    svg = ET.Element(f'{{{NS}}}svg', {'viewBox': symbol.get('viewBox', '0 0 24 24'), 'width': str(size), 'height': str(size)})
    if color:
        svg.attrib.update({'fill': 'none', 'stroke': color, 'stroke-width': '1.65', 'stroke-linecap': 'round', 'stroke-linejoin': 'round'})
    for child in symbol:
        svg.append(copy.deepcopy(child))
    surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, size, size)
    handle = Rsvg.Handle.new_from_data(ET.tostring(svg))
    viewport = Rsvg.Rectangle()
    viewport.x, viewport.y, viewport.width, viewport.height = 0, 0, size, size
    handle.render_document(cairo.Context(surface), viewport)
    surface.write_to_png(str(OUTPUT / f'{name}.png'))


for name, symbol in symbols.items():
    if name.startswith('food-'):
        render(name, symbol, 160)
for icon in ['wheel', 'menu', 'history']:
    for state, color in [('muted', '#817d70'), ('active', '#bd4828')]:
        render(f'{icon}-{state}', symbols[f'i-{icon}'], 64, color)
for icon, color in [('bowl', '#bd4828'), ('spark', '#53694d'), ('arrow', '#bd4828'), ('spin', '#fff9ee'), ('close', '#777367')]:
    render(icon, symbols[f'i-{icon}'], 64, color)
render('bowl-light', symbols['i-bowl'], 64, '#fff9ee')
render('arrow-light', symbols['i-arrow'], 64, '#fff9ee')
render('food-default', symbols['i-bowl'], 160, '#87936a')
ticket = ET.fromstring(f'<symbol xmlns="{NS}" viewBox="0 0 44 42"><path d="M5 8h34v9c-7 0-7 10 0 10v8H5v-8c7 0 7-10 0-10Z" fill="#d6dec8" stroke="#788b65" stroke-width="1.3"/><path d="M29 11v4m0 4v4m0 4v4" fill="none" stroke="#788b65" stroke-dasharray="2 2"/><path d="m14 16 9 11m0-11-9 11" stroke="#53694d" stroke-width="1.8"/><circle cx="14" cy="16" r="2" fill="#d6dec8" stroke="#53694d"/><circle cx="23" cy="27" r="2" fill="#d6dec8" stroke="#53694d"/></symbol>')
render('ticket', ticket, 96)
print(f'Generated {len(list(OUTPUT.glob("*.png")))} assets, {sum(p.stat().st_size for p in OUTPUT.glob("*.png"))} bytes')
