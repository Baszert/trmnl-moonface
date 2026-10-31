# Moonface for TRMNL

Look up. Then look at this. The Moon as it is tonight, in 3D: real craters and mountains from NASA's LRO elevation data, lit by the Sun where it really is (with cast shadows), turned the way you see it from your place, with a little Earthshine on the night side. Dithered to black and white on the OG and to 16 grays on the X. One fact in each corner: how much is lit and the phase, the next full or new moon, moonrise and moonset, and the craters where it is sunrise or sunset right now.

## How it works

- `dev/luna.js`: the Moon's position after Meeus (60 terms), optical and physical libration, the Sun's position on the Moon and the tilt. Checked against NASA SVS 5587 (hourly, 2026): libration within 0.004 degrees in longitude and 0.03 in latitude, the Sun's position on the Moon within 0.01 degrees, phase within 0.02 percent. `node dev/validate.mjs mooninfo_2026.json`
- `dev/moonface.js`: the ball, one pixel at a time: albedo and relief textures, Lunar-Lambert lighting with the local slope, soft cast shadows by ray marching the elevation, Earthshine, and Floyd-Steinberg dithering to what the screen can show.
- `dev/moon.js`: rise and set, next phases, features on the terminator (`dev/features.json`, 488 named features from the IAU gazetteer), 12 languages, drawing into the layout.
- `site/`: the textures, built by `dev/maketex.py` from NASA's CGI Moon Kit (SVS 4720, public domain; LRO LOLA and LROC WAC): `relief-{1k,2k}.webp` and `albedo-{1k,2k}.webp`, 259 KB and 824 KB. Meant for a static host.
- There is no data feed: everything is worked out in the page. Times use your TRMNL account's time zone.

## Development

```bash
cd dev && npm install && cd ..
node dev/build.mjs         # src/shared.liquid
node dev/preview.mjs       # preview/index.html, 10 nights around the world
python3 -m http.server 8775
node dev/shoot.mjs out.png "scenario=0&device=x&view=full" 1872 1404
```

## Links and license

- This is a TRMNL plugin (private plugin id 511001); the code here is what runs on TRMNL.
- The static data the plugin loads while it runs is hosted separately: [Baszert/trmnl-moon](https://github.com/Baszert/trmnl-moon) (served with GitHub Pages).
- Code: [MIT](LICENSE). Photos, images, maps and data belong to their sources, credited above and on the screen.
