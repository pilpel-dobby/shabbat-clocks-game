import type { Clock } from "../engine";

export interface Puzzle {
  id: string;
  title: string;
  description: string;
  simulationDuration: number;
  targetTimeline: boolean[];
  initialClocks: Clock[];
}

export const puzzles: Puzzle[] = [
  {
    id: "tutorial-single-clock",
    title: "1. יסודות השעון הבודד (Single Clock Basics)",
    description: "שעון שבת יחיד מחובר לחשמל הראשי. כוונו את השיניים שלו כך שהאור יידלק בין השעות 10:00 ל-14:00 (שעות 10, 11, 12, 13) במהלך היממה.",
    simulationDuration: 24,
    targetTimeline: Array(24)
      .fill(false)
      .map((_, h) => h >= 10 && h < 14), // hours 10, 11, 12, 13 are true
    initialClocks: [
      {
        id: "blue-clock",
        name: "שעון כחול (ראשי)",
        color: "#3b82f6", // Vibrant Blue
        teeth: Array(24).fill(false),
        initialPosition: 0,
      },
    ],
  },
  {
    id: "two-stage-timer",
    title: "2. טיימר דו-שלבי (Two-Stage Timer)",
    description: "כאן יש לנו שני שעונים משורשרים. השעון הכחול מחובר לחשמל הראשי ופועל תמיד. השעון הכתום מקבל חשמל רק כשהשעון הכחול פועל (פלט ON). עליכם לתכנת אותם כך שהאור יידלק ביום הראשון בין 10:00 ל-14:00 (שעות 10-13) וביום השני בין 18:00 ל-22:00 (שעות 42-45 בלבד). שימו לב: כשהשעון הכחול כבוי (OFF), השעון הכתום אינו זז (הוא קופא בזמן). לכן, השעון הכתום מתקדם רק בשעות שבהן השעון הכחול פעיל!",
    simulationDuration: 48,
    targetTimeline: Array(48)
      .fill(false)
      .map((_, h) => (h >= 10 && h < 14) || (h >= 42 && h < 46)),
    initialClocks: [
      {
        id: "blue-clock",
        name: "שעון כחול (ראשי)",
        color: "#3b82f6", // Vibrant Blue
        teeth: Array(24).fill(false),
        initialPosition: 0,
      },
      {
        id: "orange-clock",
        name: "שעון כתום (משני)",
        color: "#f97316", // Vibrant Orange
        teeth: Array(24).fill(false),
        initialPosition: 0,
      },
    ],
  },
  {
    id: "progressive-shift",
    title: "3. הסטה הדרגתית (Progressive Shift)",
    description: "בחידה זו עליכם ליצור פלט בשעות שונות בכל יום: ביום הראשון ב-10:00 (שעה 10), ביום השני ב-11:00 (שעה 35), וביום השלישי ב-12:00 (שעה 60). השעון הכחול (הראשי) מסתובב תמיד, והשעון הכתום (המשני) מופעל על ידו. רמז: השעון הכחול צריך לפעול בשעות 10, 11 ו-12 בכל יממה כדי לתת חשמל לשעון הכתום, והשעון הכתום יסנן את השעות כך שהפלט הסופי יידלק בדיוק בשעה המבוקשת לכל יום.",
    simulationDuration: 72,
    targetTimeline: Array(72)
      .fill(false)
      .map((_, h) => h === 10 || h === 35 || h === 60),
    initialClocks: [
      {
        id: "blue-clock",
        name: "שעון כחול (ראשי)",
        color: "#3b82f6",
        teeth: Array(24).fill(false),
        initialPosition: 0,
      },
      {
        id: "orange-clock",
        name: "שעון כתום (משני)",
        color: "#f97316",
        teeth: Array(24).fill(false),
        initialPosition: 0,
      },
    ],
  },
  {
    id: "triple-gear-reduction",
    title: "4. הפחתת מהירות משולשת (Triple Gear Reduction)",
    description: "חידה מאתגרת עם שלושה שעונים משורשרים! שעון כחול (ראשי), שעון כתום (משני) המקבל חשמל מהכחול, ושעון סגול (שלישוני) המקבל חשמל מהכתום. עליכם לגרום לאור להידלק אך ורק ביום השלישי בין השעות 12:00 ל-16:00 (שעות 60-63). רמז: השתמשו בשעון הכתום כ'מפחית מהירות' המאפשר לשעון הסגול להסתובב רק בחלק מהזמן, כך שהסגול יגיע לשיניים הפעילות שלו רק ביום השלישי.",
    simulationDuration: 72,
    targetTimeline: Array(72)
      .fill(false)
      .map((_, h) => h >= 60 && h < 64),
    initialClocks: [
      {
        id: "blue-clock",
        name: "שעון כחול (ראשי)",
        color: "#3b82f6",
        teeth: Array(24).fill(false),
        initialPosition: 0,
      },
      {
        id: "orange-clock",
        name: "שעון כתום (משני)",
        color: "#f97316",
        teeth: Array(24).fill(false),
        initialPosition: 0,
      },
      {
        id: "purple-clock",
        name: "שעון סגול (שלישוני)",
        color: "#a855f7",
        teeth: Array(24).fill(false),
        initialPosition: 0,
      },
    ],
  },
];
