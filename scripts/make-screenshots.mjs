// Generates store screenshots for Cafe Bazaar using resvg (proper Persian font shaping).
// Usage: node scripts/make-screenshots.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const IMG = 'src/assets/images';
const OUT = 'release/store/screenshots';
const FONTS = [
  path.resolve('scripts/fonts/Vazirmatn-Regular.ttf'),
  path.resolve('scripts/fonts/Vazirmatn-Bold.ttf'),
];
mkdirSync(OUT, { recursive: true });

const W = 1080;
const H = 1920;

const P = {
  bgTop: '#0E3835',
  bgBottom: '#072220',
  surface: '#134642',
  elevated: '#1A5752',
  onSurface: '#EEF9F7',
  muted: '#B2D4CE',
  accent: '#64DFCC',
  gold: '#F5C94C',
  gem: '#67E8F9',
};

const b64 = (p) => 'data:image/jpeg;base64,' + readFileSync(path.join(IMG, p)).toString('base64');

function render(name, svg) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: W },
    font: { fontFiles: FONTS, loadSystemFonts: false },
  });
  const png = resvg.render().asPng();
  const file = path.join(OUT, name);
  writeFileSync(file, png);
  console.log('wrote', file);
}

const defs = `
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${P.bgTop}"/>
      <stop offset="100%" stop-color="${P.bgBottom}"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${P.elevated}"/>
      <stop offset="100%" stop-color="${P.surface}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="${P.accent}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${P.accent}" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="roundBig"><rect x="0" y="0" width="880" height="880" rx="120"/></clipPath>
  </defs>`;

// ================= 1. HERO =================
function shotHero() {
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    ${defs}
    <rect width="${W}" height="${H}" fill="url(#grad)"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>

    <!-- top banner card -->
    <rect x="90" y="150" width="900" height="470" rx="56" fill="url(#cardGrad)" stroke="${P.accent}" stroke-opacity="0.35" stroke-width="3"/>
    <image href="${b64('blockestan_home_banner_1794865543793.jpg')}" x="150" y="200" width="780" height="370" preserveAspectRatio="xMidYMid slice" clip-path="url(#roundMid)"/>
    <clipPath id="roundMid"><rect x="150" y="200" width="780" height="370" rx="40"/></clipPath>

    <!-- mascot -->
    <image href="${b64('blockestan_hero_mascot_1794865543635.jpg')}" x="100" y="700" width="880" height="880" preserveAspectRatio="xMidYMid slice" clip-path="url(#roundBig)"/>

    <!-- title -->
    <text x="540" y="1040" text-anchor="middle" font-family="Vazirmatn" font-weight="800" font-size="92" fill="${P.onSurface}">بلوکستان</text>
    <text x="540" y="1120" text-anchor="middle" font-family="Vazirmatn" font-weight="600" font-size="44" fill="${P.gold}">پازل بلوکی آرامش‌بخش</text>
    <text x="540" y="1190" text-anchor="middle" font-family="Vazirmatn" font-weight="400" font-size="36" fill="${P.muted}">۶۰ مرحلهٔ داستانی + چالش روزانه</text>

    <!-- feature chips -->
    <g font-family="Vazirmatn" font-weight="700" font-size="32" fill="${P.onSurface}">
      <rect x="120" y="1280" width="260" height="92" rx="46" fill="${P.elevated}" stroke="${P.gold}" stroke-opacity="0.5" stroke-width="2"/>
      <text x="250" y="1340" text-anchor="middle">۸ × ۸</text>
      <rect x="410" y="1280" width="260" height="92" rx="46" fill="${P.elevated}" stroke="${P.gold}" stroke-opacity="0.5" stroke-width="2"/>
      <text x="540" y="1340" text-anchor="middle">بدون اینترنت</text>
      <rect x="700" y="1280" width="260" height="92" rx="46" fill="${P.elevated}" stroke="${P.gold}" stroke-opacity="0.5" stroke-width="2"/>
      <text x="830" y="1340" text-anchor="middle" font-size="26">همهٔ سنین</text>
    </g>
  </svg>`;
  render('01-hero.png', svg);
}

// ================= 2. STORY =================
function shotStory() {
  const cards = [
    { img: 'story_ch1_village_1794866259152.jpg', label: 'فصل ۱ · روستا', x: 40 },
    { img: 'story_ch2_valley_1794866259603.jpg', label: 'فصل ۲ · دره', x: 390 },
    { img: 'story_ch3_palace_1794866260528.jpg', label: 'فصل ۳ · قصر', x: 740 },
  ];
  let cardsSvg = '';
  for (const c of cards) {
    cardsSvg += `
      <rect x="${c.x}" y="800" width="300" height="470" rx="48" fill="url(#cardGrad)" stroke="${P.gold}" stroke-opacity="0.4" stroke-width="3"/>
      <clipPath id="cr_${c.x}"><rect x="${c.x + 16}" y="816" width="268" height="360" rx="36"/></clipPath>
      <image href="${b64(c.img)}" x="${c.x + 16}" y="816" width="268" height="360" preserveAspectRatio="xMidYMid slice" clip-path="url(#cr_${c.x})"/>
      <text x="${c.x + 150}" y="1230" text-anchor="middle" font-family="Vazirmatn" font-weight="700" font-size="30" fill="${P.onSurface}">${c.label}</text>
      <rect x="${c.x + 60}" y="1270" width="180" height="60" rx="30" fill="${P.accent}" stroke-opacity="0"/>
      <text x="${c.x + 150}" y="1310" text-anchor="middle" font-family="Vazirmatn" font-weight="700" font-size="28" fill="#04211E">بازی کن</text>`;
  }
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    ${defs}
    <rect width="${W}" height="${H}" fill="url(#grad)"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>
    <text x="540" y="420" text-anchor="middle" font-family="Vazirmatn" font-weight="800" font-size="78" fill="${P.onSurface}">داستان بلوکستان</text>
    <text x="540" y="510" text-anchor="middle" font-family="Vazirmatn" font-weight="600" font-size="40" fill="${P.gold}">سفری از روستا تا قصر</text>
    <text x="540" y="640" text-anchor="middle" font-family="Vazirmatn" font-weight="400" font-size="34" fill="${P.muted}">۳ فصل · ۶۰ مرحله · معماهای تدریجی</text>
    ${cardsSvg}
  </svg>`;
  render('02-story.png', svg);
}

// ================= 3. REWARDS =================
function shotRewards() {
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    ${defs}
    <rect width="${W}" height="${H}" fill="url(#grad)"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>
    <text x="540" y="420" text-anchor="middle" font-family="Vazirmatn" font-weight="800" font-size="78" fill="${P.onSurface}">سکه و الماس بگیر</text>
    <text x="540" y="510" text-anchor="middle" font-family="Vazirmatn" font-weight="600" font-size="38" fill="${P.gold}">جایزهٔ روزانه + تبلیغ جایزه‌دار</text>
    <text x="540" y="580" text-anchor="middle" font-family="Vazirmatn" font-weight="400" font-size="34" fill="${P.muted}">باز کن، بخر و پوسته‌ها را سفارشی کن</text>

    <rect x="140" y="700" width="800" height="560" rx="64" fill="url(#cardGrad)" stroke="${P.gold}" stroke-opacity="0.45" stroke-width="3"/>
    <clipPath id="trBig"><rect x="210" y="770" width="660" height="420" rx="48"/></clipPath>
    <image href="${b64('blockestan_trophy_reward_1794865544012.jpg')}" x="210" y="770" width="660" height="420" preserveAspectRatio="xMidYMid slice" clip-path="url(#trBig)"/>

    <!-- coin + gem -->
    <circle cx="310" cy="1400" r="105" fill="${P.gold}" stroke="#E7B23C" stroke-width="10"/>
    <circle cx="310" cy="1400" r="72" fill="none" stroke="#8a631c" stroke-width="5" opacity="0.5"/>
    <text x="310" y="1445" text-anchor="middle" font-size="90" font-weight="800" fill="#6B4A08" font-family="Tahoma">★</text>
    <path d="M820 1330 L900 1370 L820 1470 L740 1370 Z" fill="${P.gem}" stroke="#3BA8C2" stroke-width="8"/>

    <text x="460" y="1420" font-family="Vazirmatn" font-weight="700" font-size="38" fill="${P.onSurface}">+۵۰۰ سکه و +۲۵ الماس</text>
    <text x="460" y="1475" font-family="Vazirmatn" font-weight="400" font-size="30" fill="${P.muted}">با پیکربندی کافه‌بازار</text>
  </svg>`;
  render('03-rewards.png', svg);
}

// ================= 4. GAMEPLAY =================
function shotGame() {
  const cells = 8, cs = 96, ox = 270, oy = 780;
  const colors = [P.accent, P.gold, '#F28B8B', '#BFE3D2', P.gem];
  let board = '';
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      const x = ox + c * cs, y = oy + r * cs;
      if ((r * 7 + c * 3) % 5 === 0) {
        const col = colors[(r + c) % colors.length];
        board += `<rect x="${x}" y="${y}" width="${cs - 6}" height="${cs - 6}" rx="18" fill="${col}" opacity="0.92"/>`;
      } else {
        board += `<rect x="${x}" y="${y}" width="${cs - 6}" height="${cs - 6}" rx="18" fill="${P.surface}" stroke="${P.accent}" stroke-width="3" stroke-opacity="0.35"/>`;
      }
    }
  }
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    ${defs}
    <rect width="${W}" height="${H}" fill="url(#grad)"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>
    <clipPath id="mascotSmall"><rect x="330" y="180" width="420" height="420" rx="100"/></clipPath>
    <image href="${b64('blockestan_hero_mascot_1794865543635.jpg')}" x="330" y="180" width="420" height="420" preserveAspectRatio="xMidYMid slice" clip-path="url(#mascotSmall)"/>
    <text x="540" y="680" text-anchor="middle" font-family="Vazirmatn" font-weight="800" font-size="64" fill="${P.onSurface}">بازی ۸×۸</text>
    <text x="540" y="755" text-anchor="middle" font-family="Vazirmatn" font-weight="600" font-size="36" fill="${P.gold}">بلوک‌ها را بچین و خط‌ها را کامل کن</text>
    <rect x="90" y="760" width="900" height="870" rx="48" fill="${P.surface}" stroke="${P.accent}" stroke-opacity="0.4" stroke-width="4"/>
    ${board}
    <text x="540" y="1720" text-anchor="middle" font-family="Vazirmatn" font-weight="400" font-size="34" fill="${P.muted}">ابزار چکش و راهنما در دسترس توست</text>
  </svg>`;
  render('04-gameplay.png', svg);
}

shotHero();
shotStory();
shotRewards();
shotGame();
console.log('done');
