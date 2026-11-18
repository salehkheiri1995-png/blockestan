// Renders an SVG icon to PNG for store/launcher assets.
// Usage: node scripts/render-icon.mjs <input.svg> <output.png> [size]
import { readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const [, , input, output, sizeArg] = process.argv;
if (!input || !output) {
  console.error('Usage: node scripts/render-icon.mjs <input.svg> <output.png> [size]');
  process.exit(1);
}

const size = Number(sizeArg || 1024);
const svg = readFileSync(input, 'utf8');
const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: size },
  background: 'rgba(0,0,0,0)',
});
const png = resvg.render().asPng();
writeFileSync(output, png);
console.log(`Wrote ${output} (${size}x${size})`);
