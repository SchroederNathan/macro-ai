import { create } from 'zustand';
import { getDailyLog, getStreakData, saveStreakData, type StreakData } from '@/lib/storage';
import { formatDateKey } from '@/types/nutrition';

interface StreakState {
  currentStreak: number;
  bestStreak: number;
  lastLoggedDate: string;
}

interface StreakActions {
  /** Recalculate streak from daily log data */
  calculate: () => void;
}

type StreakStore = StreakState & StreakActions;

/**
 * Check if a date has at least one food entry logged
 */
function dayHasEntries(date: Date): boolean {
  const log = getDailyLog(formatDateKey(date));
  return (log?.entries.length ?? 0) > 0;
}

export const useStreakStore = create<StreakStore>((set) => ({
  currentStreak: 0,
  bestStreak: 0,
  lastLoggedDate: '',

  calculate: () => {
    const saved = getStreakData();
    let streak = 0;
    const today = new Date();
    const check = new Date(today);

    // Walk backwards from today
    while (true) {
      if (dayHasEntries(check)) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else {
        break;
      }
    }

    const bestStreak = Math.max(streak, saved?.bestStreak ?? 0);
    const lastLoggedDate = formatDateKey(today);

    const data: StreakData = { currentStreak: streak, bestStreak, lastLoggedDate };
    saveStreakData(data);

    set({ currentStreak: streak, bestStreak, lastLoggedDate });
  },
}));
