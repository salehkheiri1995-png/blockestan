import { ThemeCurrency } from '../engine/balance';

export interface GamePalette {
  themeId: string;
  label: string;
  subtitle: string;
  unlockCurrency: ThemeCurrency;
  price: number;
  dark: boolean;
  backgroundTop: string;
  backgroundBottom: string;
  surface: string;
  surfaceElevated: string;
  onSurface: string;
  onSurfaceMuted: string;
  accent: string;
  onAccent: string;
  boardBackground: string;
  cellEmpty: string;
  cellGrid: string;
  blockedCell: string;
  validGhost: string;
  invalidGhost: string;
  success: string;
  danger: string;
  gold: string;
  gem: string;
  pieceColors: string[];
  pieceShadow: string;
}

// 1. فیروزه‌ای آرام (رایگان - پیش‌فرض)
const turquoise: GamePalette = {
  themeId: 'turquoise',
  label: 'فیروزه‌ای آرام',
  subtitle: 'ملایم و چشم‌نواز برای بازی طولانی',
  unlockCurrency: 'COINS',
  price: 0,
  dark: true,
  backgroundTop: '#0E3835',
  backgroundBottom: '#072220',
  surface: '#134642',
  surfaceElevated: '#1A5752',
  onSurface: '#EEF9F7',
  onSurfaceMuted: '#B2D4CE',
  accent: '#64DFCC',
  onAccent: '#062623',
  boardBackground: '#0A2E2B',
  cellEmpty: '#103E3A',
  cellGrid: '#25615A',
  blockedCell: '#396B65',
  validGhost: 'rgba(100, 223, 204, 0.52)',
  invalidGhost: 'rgba(244, 114, 134, 0.52)',
  success: '#4ADE9D',
  danger: '#F47286',
  gold: '#F5C94C',
  gem: '#67E8F9',
  pieceColors: ['#5CD6C4', '#6CAEE8', '#ECC45A', '#E68393', '#B58CEB'],
  pieceShadow: 'rgba(0, 0, 0, 0.36)',
};

// 2. شب بنفش مخملی (۲۵۰ سکه)
const purpleNight: GamePalette = {
  themeId: 'purple_night',
  label: 'شب بنفش مخملی',
  subtitle: 'مهتابی و بی‌آزار برای چشمان خسته',
  unlockCurrency: 'COINS',
  price: 250,
  dark: true,
  backgroundTop: '#26184D',
  backgroundBottom: '#140C2B',
  surface: '#31215E',
  surfaceElevated: '#3E2B72',
  onSurface: '#F3EEFF',
  onSurfaceMuted: '#C7B8E8',
  accent: '#C495FA',
  onAccent: '#1A0C38',
  boardBackground: '#1C113A',
  cellEmpty: '#26184C',
  cellGrid: '#4B397A',
  blockedCell: '#5A4A85',
  validGhost: 'rgba(196, 149, 250, 0.52)',
  invalidGhost: 'rgba(244, 114, 134, 0.52)',
  success: '#6EE7B7',
  danger: '#F47286',
  gold: '#F5D05B',
  gem: '#7DD3FC',
  pieceColors: ['#BE90F7', '#7CC3EE', '#F0CF65', '#E8859A', '#6BD4BD'],
  pieceShadow: 'rgba(0, 0, 0, 0.42)',
};

// 3. آفتابی ملایم / کهربایی (۳۵۰ سکه)
const sunny: GamePalette = {
  themeId: 'sunny',
  label: 'کرم و کهربایی',
  subtitle: 'گرمای آرامش‌بخش بدون خیرگی نور',
  unlockCurrency: 'COINS',
  price: 350,
  dark: false,
  backgroundTop: '#FAF0DA',
  backgroundBottom: '#EFE0BE',
  surface: '#FDF8EC',
  surfaceElevated: '#FFFFFF',
  onSurface: '#3E2E17',
  onSurfaceMuted: '#756142',
  accent: '#C97218',
  onAccent: '#FFFBF2',
  boardBackground: '#E5CFA0',
  cellEmpty: '#F2E2BD',
  cellGrid: '#CFAE72',
  blockedCell: '#B58E4C',
  validGhost: 'rgba(21, 128, 118, 0.54)',
  invalidGhost: 'rgba(190, 48, 56, 0.54)',
  success: '#1B7A58',
  danger: '#BD363E',
  gold: '#B66A0D',
  gem: '#0284C7',
  pieceColors: ['#218379', '#3867B8', '#C67B1F', '#C14A5E', '#794BB3'],
  pieceShadow: 'rgba(40, 25, 5, 0.22)',
};

// 4. مهِ نقره‌ای روشن (۴۵۰ سکه)
const minimalLight: GamePalette = {
  themeId: 'minimal_light',
  label: 'مهِ نقره‌ای',
  subtitle: 'تمیز، متعادل و کم‌تضاد برای تمرکز بالا',
  unlockCurrency: 'COINS',
  price: 450,
  dark: false,
  backgroundTop: '#EEF3F7',
  backgroundBottom: '#DDE5EE',
  surface: '#F9FBFD',
  surfaceElevated: '#FFFFFF',
  onSurface: '#182433',
  onSurfaceMuted: '#516278',
  accent: '#157A74',
  onAccent: '#FFFFFF',
  boardBackground: '#D5DFEB',
  cellEmpty: '#E9EFF6',
  cellGrid: '#B8C7D9',
  blockedCell: '#8E9FB3',
  validGhost: 'rgba(21, 122, 116, 0.5)',
  invalidGhost: 'rgba(195, 52, 58, 0.5)',
  success: '#1D7C4D',
  danger: '#C1383E',
  gold: '#AE6D11',
  gem: '#0369A1',
  pieceColors: ['#1E857E', '#3A6CC2', '#C5801C', '#BF4D62', '#7C51B8'],
  pieceShadow: 'rgba(15, 23, 42, 0.16)',
};

// 5. اقیانوس آرام (۵۵۰ سکه)
const deepOcean: GamePalette = {
  themeId: 'deep_ocean',
  label: 'اقیانوس آرام',
  subtitle: 'آبی عمیق مرجانی با حس سکوت دریا',
  unlockCurrency: 'COINS',
  price: 550,
  dark: true,
  backgroundTop: '#0F2C47',
  backgroundBottom: '#08192B',
  surface: '#153757',
  surfaceElevated: '#1C446B',
  onSurface: '#ECF5FC',
  onSurfaceMuted: '#A7C3DC',
  accent: '#63C5ED',
  onAccent: '#071E33',
  boardBackground: '#0B2339',
  cellEmpty: '#11304C',
  cellGrid: '#28527A',
  blockedCell: '#3C6287',
  validGhost: 'rgba(99, 197, 237, 0.52)',
  invalidGhost: 'rgba(242, 118, 134, 0.52)',
  success: '#52D6A0',
  danger: '#F27686',
  gold: '#F2C959',
  gem: '#7DD3FC',
  pieceColors: ['#5AC2EB', '#6FD4AF', '#EFC45E', '#E68598', '#9B98EC'],
  pieceShadow: 'rgba(0, 0, 0, 0.40)',
};

// 6. جنگل زمرد و مریم‌گلی (۶۵۰ سکه)
const emeraldForest: GamePalette = {
  themeId: 'emerald_forest',
  label: 'جنگل زمرد',
  subtitle: 'سبز طبیعی درختان برای آرامش ذهن',
  unlockCurrency: 'COINS',
  price: 650,
  dark: true,
  backgroundTop: '#163529',
  backgroundBottom: '#0B1F17',
  surface: '#1D4233',
  surfaceElevated: '#265341',
  onSurface: '#EEF8F2',
  onSurfaceMuted: '#B2D1BE',
  accent: '#7AD99E',
  onAccent: '#092216',
  boardBackground: '#10291F',
  cellEmpty: '#18382B',
  cellGrid: '#315E4B',
  blockedCell: '#47705E',
  validGhost: 'rgba(122, 217, 158, 0.52)',
  invalidGhost: 'rgba(242, 120, 128, 0.52)',
  success: '#6AE0A2',
  danger: '#F27880',
  gold: '#ECC55C',
  gem: '#67E8F9',
  pieceColors: ['#70D497', '#67BCE0', '#E8C05A', '#DF858E', '#B394E2'],
  pieceShadow: 'rgba(0, 0, 0, 0.38)',
};

// 7. شفق گل‌بهی (۱۲ الماس - ویژه)
const roseDusk: GamePalette = {
  themeId: 'rose_dusk',
  label: 'شفق گل‌بهی',
  subtitle: 'پوستهٔ الماسی · گرگ‌ومیش لطیف ارغوانی',
  unlockCurrency: 'GEMS',
  price: 12,
  dark: true,
  backgroundTop: '#3C2038',
  backgroundBottom: '#1F1020',
  surface: '#4B2A45',
  surfaceElevated: '#5C3555',
  onSurface: '#FDF1F6',
  onSurfaceMuted: '#DBB7C7',
  accent: '#F09DB8',
  onAccent: '#2C0F1D',
  boardBackground: '#2B1628',
  cellEmpty: '#391F35',
  cellGrid: '#663D5E',
  blockedCell: '#77506F',
  validGhost: 'rgba(240, 157, 184, 0.52)',
  invalidGhost: 'rgba(248, 113, 113, 0.52)',
  success: '#6EE7B7',
  danger: '#FB7185',
  gold: '#F5CB69',
  gem: '#93C5FD',
  pieceColors: ['#EC98B4', '#86C9EC', '#F2C666', '#7AD6B8', '#C69CF2'],
  pieceShadow: 'rgba(0, 0, 0, 0.40)',
};

// 8. تاج لاجوردی بلوکستان (۲۰ الماس - شاهکار)
const royalMosaic: GamePalette = {
  themeId: 'royal_mosaic',
  label: 'تاج لاجوردی',
  subtitle: 'پوستهٔ الماسی · کاشی‌کاری شبانه و طلا',
  unlockCurrency: 'GEMS',
  price: 20,
  dark: true,
  backgroundTop: '#1A2456',
  backgroundBottom: '#0C1230',
  surface: '#222F6B',
  surfaceElevated: '#2B3B82',
  onSurface: '#F0F4FF',
  onSurfaceMuted: '#B6C4EB',
  accent: '#F2C75C',
  onAccent: '#261B04',
  boardBackground: '#131C45',
  cellEmpty: '#1B275C',
  cellGrid: '#384A96',
  blockedCell: '#4D5C99',
  validGhost: 'rgba(242, 199, 92, 0.52)',
  invalidGhost: 'rgba(244, 114, 134, 0.52)',
  success: '#5EEAD4',
  danger: '#F47286',
  gold: '#F6CF65',
  gem: '#7DD3FC',
  pieceColors: ['#F0C45A', '#67D4E8', '#78DDA8', '#E986A3', '#A797F2'],
  pieceShadow: 'rgba(0, 0, 0, 0.44)',
};

export const GameThemes = {
  all: [
    turquoise,
    purpleNight,
    sunny,
    minimalLight,
    deepOcean,
    emeraldForest,
    roseDusk,
    royalMosaic,
  ],
  byId(id: string): GamePalette {
    return this.all.find((t) => t.themeId === id) ?? turquoise;
  },
};

export function hexAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
