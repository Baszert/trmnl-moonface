#!/usr/bin/env python3
"""Builds the Moon textures from NASA's CGI Moon Kit (SVS 4720, public domain; LRO LOLA elevation, LROC WAC colour).
Usage: maketex.py ldem_16.tif lroc_color_2k.jpg      (needs numpy, scipy, tifffile, pillow)
Writes, in two sizes (1k for small screens, 2k for the TRMNL X):
  site/relief-{1k,2k}.webp  local relief: elevation minus its smooth trend, +-2.5 km mapped to 0..255
  site/albedo-{1k,2k}.webp  how bright the surface is (maria dark, highlands and ray craters bright)"""
import sys, numpy as np, tifffile
from PIL import Image
from scipy import ndimage
h = tifffile.imread(sys.argv[1]).astype(np.float32)     # km, 2880 x 5760, row 0 = north, column 0 = 180 W
col = Image.open(sys.argv[2]).convert('L')
for tag, W in (('1k', 1024), ('2k', 2048)):
    H = W // 2
    a = np.asarray(Image.fromarray(h, mode='F').resize((W, H), Image.BOX))
    d = a - ndimage.gaussian_filter(a, W / 2048 * 10, mode=('nearest', 'wrap'))
    r8 = np.round(127.5 + np.clip(d / 2.5, -1, 1) * 127.5).astype(np.uint8)
    Image.fromarray(r8, 'L').save('site/relief-%s.webp' % tag, quality=90, method=6)
    Image.fromarray(np.asarray(col.resize((W, H), Image.LANCZOS)), 'L').save('site/albedo-%s.webp' % tag, quality=82, method=6)
