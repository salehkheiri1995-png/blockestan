import ch1Img from '../assets/images/story_ch1_village_1794866259152.jpg';
import ch2Img from '../assets/images/story_ch2_valley_1794866259603.jpg';
import ch3Img from '../assets/images/story_ch3_palace_1794866260528.jpg';

export interface StoryDialogueLine {
  speaker: string;
  mood: string;
  text: string;
}

export interface StoryChapter {
  id: number;
  title: string;
  shortTitle: string;
  subtitle: string;
  levelFrom: number;
  levelTo: number;
  image: string;
  landmark: string;
  objectiveSummary: string;
  tipFromFirooz: string;
  dialogue: StoryDialogueLine[];
}

export const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 1,
    title: 'فصل ۱: دهکدهٔ فیروزه',
    shortTitle: 'دهکدهٔ فیروزه',
    subtitle: 'مراحل ۱ تا ۱۵ · روشن‌کردن فانوس‌های خوابیده',
    levelFrom: 1,
    levelTo: 15,
    image: ch1Img,
    landmark: 'کوچه‌باغ کاشی‌های فیروزه‌ای',
    objectiveSummary: 'نگین‌های ستاره‌دار را آزاد کن تا چراغ‌های دهکده دوباره روشن شوند.',
    tipFromFirooz: 'اگر چند سطر را با هم کامل کنی، نور بیشتری به فانوس‌ها می‌رسد!',
    dialogue: [
      {
        speaker: 'فیروز (نگهبان بلوکستان)',
        mood: 'امیدوار',
        text: 'سلام دوست من! دیشب بادِ بی‌رنگ، کاشی‌های روشن دهکدهٔ فیروزه را پراکنده کرد و فانوس‌های کوچه خاموش شدند.',
      },
      {
        speaker: 'فیروز',
        mood: 'مهربان',
        text: 'با چیدن بلوک‌ها کنار هم و کامل‌کردن سطرها و ستون‌ها، می‌توانی خانه‌های ستاره‌دار (★) را آزاد کنی و گرمای نور را به دهکده برگردانی.',
      },
      {
        speaker: 'فیروز',
        mood: 'هیجان‌زده',
        text: 'با پایان هر فصل ۵ الماس و ۱۰۰ سکهٔ پاداش می‌گیری؛ با الماس‌ها می‌توانی پوسته‌های کمیاب را هم باز کنی!',
      },
    ],
  },
  {
    id: 2,
    title: 'فصل ۲: درهٔ یاقوت و کهربا',
    shortTitle: 'درهٔ یاقوت',
    subtitle: 'مراحل ۱۶ تا ۴۰ · ترمیم پل‌های آفتابی',
    levelFrom: 16,
    levelTo: 40,
    image: ch2Img,
    landmark: 'پل‌های سنگی درهٔ غروب',
    objectiveSummary: 'ستون‌های سنگی را پاک‌سازی کن و مسیر کاروان نور را به باغ‌های بالایی باز کن.',
    tipFromFirooz: 'در مراحل سخت‌تر، «چکش» و «تعویض قطعه» همیشه پشتیبان تو هستند.',
    dialogue: [
      {
        speaker: 'فیروز',
        mood: 'خوشحال',
        text: 'آفرین! تمام فانوس‌های دهکدهٔ فیروزه روشن شدند و مردم دوباره دور هم جمع شدند.',
      },
      {
        speaker: 'فیروز',
        mood: 'کنجکاو',
        text: 'حالا به درهٔ یاقوت و کهربا رسیدیم؛ جایی که پل‌های قدیمی زیر آفتاب غروب منتظر بلوک‌های دقیق و هوشمندی تو هستند.',
      },
      {
        speaker: 'فیروز',
        mood: 'مصمم',
        text: 'اینجا بلوک‌های سنگی بیشتری سر راه است. با آرامش فکر کن، کمبو بساز و با گرفتن ۳ ستاره الماس ذخیره کن!',
      },
    ],
  },
  {
    id: 3,
    title: 'فصل ۳: تالار تاج‌گذاری',
    shortTitle: 'تالار تاج‌گذاری',
    subtitle: 'مراحل ۴۱ تا ۶۰ · بازگرداندن تاج نور',
    levelFrom: 41,
    levelTo: 60,
    image: ch3Img,
    landmark: 'کاخ ستاره‌باران لاجوردی',
    objectiveSummary: 'آخرین معماهای کاخ بزرگ را حل کن تا تاج نور دوباره بر تخت بلوکستان بدرخشد.',
    tipFromFirooz: 'اینجا اوج هنر چیدمان است؛ هر حرکت را مثل یک استاد بزرگ بسنج.',
    dialogue: [
      {
        speaker: 'فیروز',
        mood: 'شگفت‌زده',
        text: 'به حیاط ستاره‌باران کاخ بلوکستان خوش آمدی! فقط ۲۰ قدم تا تاج‌گذاری نهایی باقی مانده.',
      },
      {
        speaker: 'فیروز',
        mood: 'سپاس‌گزار',
        text: 'در این تالار، گنبدهای لاجوردی چشم به مهارت تو دوخته‌اند تا آخرین تکه‌های نور سر جای خود بنشینند.',
      },
      {
        speaker: 'فیروز',
        mood: 'مفتخر',
        text: 'بیا تاج نور را روشن کنیم و نام تو را در تاریخ بلوکستان جاودانه سازیم!',
      },
    ],
  },
];

export function chapterForLevel(levelId: number): StoryChapter {
  return (
    STORY_CHAPTERS.find((c) => levelId >= c.levelFrom && levelId <= c.levelTo) ?? STORY_CHAPTERS[0]
  );
}

export function isChapterCompleted(chapter: StoryChapter, levelStars: Record<number, number>): boolean {
  for (let id = chapter.levelFrom; id <= chapter.levelTo; id++) {
    if ((levelStars[id] ?? 0) <= 0) return false;
  }
  return true;
}

export function chapterSolvedCount(chapter: StoryChapter, levelStars: Record<number, number>): number {
  let count = 0;
  for (let id = chapter.levelFrom; id <= chapter.levelTo; id++) {
    if ((levelStars[id] ?? 0) > 0) count++;
  }
  return count;
}

export function activeStoryChapter(unlockedLevel: number): StoryChapter {
  return chapterForLevel(unlockedLevel);
}
