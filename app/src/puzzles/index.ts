import type { Clock } from "../engine";

export type Difficulty = "קל" | "בינוני" | "קשה";

export interface Puzzle {
  id: string;
  title: string;
  /** Short label for the puzzle tabs (mobile friendly). */
  shortTitle: string;
  difficulty: Difficulty;
  description: string;
  /** Optional hint, hidden until the player asks for it. */
  hint?: string;
  simulationDuration: number;
  targetTimeline: boolean[];
  initialClocks: Clock[];
}

/** Build a target timeline of `duration` hours that is ON exactly at the given absolute hours. */
function onAt(duration: number, hours: number[]): boolean[] {
  const set = new Set(hours);
  return Array.from({ length: duration }, (_, h) => set.has(h));
}

/** Inclusive-exclusive range helper: range(10, 14) => [10, 11, 12, 13]. */
function range(from: number, to: number): number[] {
  return Array.from({ length: to - from }, (_, i) => from + i);
}

const blueClock = (): Clock => ({
  id: "blue-clock",
  name: "שעון כחול (ראשי)",
  color: "#3b82f6",
  teeth: Array(24).fill(false),
  initialPosition: 0,
});

const orangeClock = (): Clock => ({
  id: "orange-clock",
  name: "שעון כתום (משני)",
  color: "#f97316",
  teeth: Array(24).fill(false),
  initialPosition: 0,
});

const purpleClock = (): Clock => ({
  id: "purple-clock",
  name: "שעון סגול (שלישוני)",
  color: "#a855f7",
  teeth: Array(24).fill(false),
  initialPosition: 0,
});

export const puzzles: Puzzle[] = [
  {
    id: "tutorial-single-clock",
    title: "יסודות השעון הבודד",
    shortTitle: "שעון בודד",
    difficulty: "קל",
    description:
      "שעון שבת יחיד מחובר לחשמל הראשי. כוונו את השיניים שלו כך שהאור יידלק בין 10:00 ל-14:00 (השעות 10, 11, 12, 13) במהלך היממה.",
    hint: "כל שן היא שעה אחת. סמנו את ארבע השיניים של 10, 11, 12 ו-13.",
    simulationDuration: 24,
    targetTimeline: onAt(24, range(10, 14)),
    initialClocks: [blueClock()],
  },
  {
    id: "two-windows",
    title: "שני חלונות ביום",
    shortTitle: "שני חלונות",
    difficulty: "קל",
    description:
      "אותו שעון בודד, אבל הפעם צריך שני חלונות: אור בוקר בין 06:00 ל-08:00, ואור ערב בין 18:00 ל-21:00.",
    hint: "אפשר לגרור על כמה שיניים ברצף בתנועה אחת. צריך שני רצפים נפרדים: 6–7 ו-18–20.",
    simulationDuration: 24,
    targetTimeline: onAt(24, [...range(6, 8), ...range(18, 21)]),
    initialClocks: [blueClock()],
  },
  {
    id: "skip-a-day",
    title: "לדלג על יום",
    shortTitle: "דילוג על יום",
    difficulty: "בינוני",
    description:
      "שעון בודד חוזר על עצמו כל יממה, ולכן לבדו הוא לא יכול לדלג על יום. כאן יש שני שעונים משורשרים: האור צריך להידלק רק ביום השני, בין 19:00 ל-23:00, וביום הראשון להישאר כבוי.",
    hint: "אם הכחול נותן חשמל 4 שעות ביום, הכתום מתקדם רק 4 שיניים ביום. ביום הראשון הוא עובר על שיניים 0–3, וביום השני על 4–7.",
    simulationDuration: 48,
    targetTimeline: onAt(48, range(43, 47)),
    initialClocks: [blueClock(), orangeClock()],
  },
  {
    id: "two-stage-timer",
    title: "טיימר דו-שלבי",
    shortTitle: "טיימר דו-שלבי",
    difficulty: "בינוני",
    description:
      "שני שעונים משורשרים. הכחול מחובר לחשמל הראשי ופועל תמיד, והכתום מקבל חשמל רק כשהכחול מוציא חשמל. האור צריך להידלק ביום הראשון בין 10:00 ל-14:00, וביום השני בין 18:00 ל-22:00 בלבד.",
    hint: "כשהכחול כבוי, הכתום קופא במקומו. לכן הכחול צריך לפעול בשני החלונות (10–13 ו-18–21), והכתום יבחר באיזה יום כל חלון נדלק.",
    simulationDuration: 48,
    targetTimeline: onAt(48, [...range(10, 14), ...range(42, 46)]),
    initialClocks: [blueClock(), orangeClock()],
  },
  {
    id: "shabbat-meals",
    title: "סעודות שבת",
    shortTitle: "סעודות שבת",
    difficulty: "בינוני",
    description:
      "יום 1 הוא שישי ויום 2 הוא שבת. בליל שבת האור צריך לדלוק בין 18:00 ל-23:00. בשבת הוא צריך לדלוק לסעודת הצהריים בין 12:00 ל-14:00, ושוב בין 18:00 ל-21:00 לסעודה שלישית. בצהרי שישי האור צריך להישאר כבוי.",
    hint: "הכחול צריך לתת חשמל בכל השעות שעשויות לדלוק (12–13 ו-18–22). כך הכתום מתקדם 7 שיניים ביממה, והשיניים שלו קובעות מה נדלק בכל יום.",
    simulationDuration: 48,
    targetTimeline: onAt(48, [...range(18, 23), ...range(36, 38), ...range(42, 45)]),
    initialClocks: [blueClock(), orangeClock()],
  },
  {
    id: "gradual-dimming",
    title: "כיבוי הדרגתי",
    shortTitle: "כיבוי הדרגתי",
    difficulty: "בינוני",
    description:
      "האור נדלק כל ערב ב-20:00, אבל כל יום הוא דולק פחות זמן: ביום הראשון 4 שעות (20:00–24:00), ביום השני שעתיים (20:00–22:00), וביום השלישי שעה אחת בלבד (20:00–21:00).",
    hint: "כשהכחול דולק בין 20:00 לחצות, הכתום מתקדם 4 שיניים בכל ערב: 0–3, אחר כך 4–7, ואז 8–11.",
    simulationDuration: 72,
    targetTimeline: onAt(72, [...range(20, 24), 44, 45, 68]),
    initialClocks: [blueClock(), orangeClock()],
  },
  {
    id: "progressive-shift",
    title: "הסטה הדרגתית",
    shortTitle: "הסטה הדרגתית",
    difficulty: "קשה",
    description:
      "האור צריך להידלק לשעה אחת בכל יום, אבל בכל יום שעה מאוחר יותר: ביום הראשון ב-10:00, ביום השני ב-11:00 וביום השלישי ב-12:00. הכחול מסתובב תמיד, והכתום מופעל על ידו.",
    hint: "הכחול צריך לפעול בשעות 10, 11 ו-12 בכל יממה כדי לתת חשמל לכתום. הכתום מתקדם 3 שיניים ביום ומסנן את השעות, כך שבכל יום נדלקת רק השעה הנכונה.",
    simulationDuration: 72,
    targetTimeline: onAt(72, [10, 35, 60]),
    initialClocks: [blueClock(), orangeClock()],
  },
  {
    id: "wrap-around",
    title: "הסיבוב החוזר",
    shortTitle: "הסיבוב החוזר",
    difficulty: "קשה",
    description:
      "ביום הראשון וביום השלישי האור צריך לדלוק בין 08:00 ל-11:00. ביום השני הוא צריך לדלוק דווקא בלילה, בין 02:00 ל-05:00. שימו לב: לשעון המשני יש רק 24 שיניים, ואחרי שהוא משלים סיבוב הוא חוזר להתחלה.",
    hint: "אם הכחול דולק 12 שעות ביום (00:00–12:00), הכתום עובר בשני ימים סיבוב שלם של 24 שיניים. ביום השלישי הוא חוזר לאותן שיניים של היום הראשון.",
    simulationDuration: 72,
    targetTimeline: onAt(72, [...range(8, 11), ...range(26, 29), ...range(56, 59)]),
    initialClocks: [blueClock(), orangeClock()],
  },
  {
    id: "triple-gear-reduction",
    title: "הפחתת מהירות משולשת",
    shortTitle: "שלושה שעונים",
    difficulty: "קשה",
    description:
      "שלושה שעונים משורשרים: הכחול מחובר לחשמל, הכתום מקבל חשמל מהכחול, והסגול מקבל חשמל מהכתום. האור צריך להידלק רק ביום השלישי, בין 12:00 ל-16:00.",
    hint: "השתמשו בכתום כ'מפחית מהירות' שמעביר חשמל לסגול רק בחלק מהזמן. כך הסגול מתקדם לאט, ומגיע לשיניים הפעילות שלו רק ביום השלישי.",
    simulationDuration: 72,
    targetTimeline: onAt(72, range(60, 64)),
    initialClocks: [blueClock(), orangeClock(), purpleClock()],
  },
];
