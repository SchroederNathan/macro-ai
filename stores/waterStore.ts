import { create } from 'zustand';
import {
  getWaterLog,
  saveWaterLog,
  getWaterUnit,
  saveWaterUnit,
  type WaterLog,
  type WaterUnit,
} from '@/lib/storage';
import { formatDateKey } from '@/types/nutrition';

// ============================================
// Constants
// ============================================

/** 1 cup = 250ml (per spec: 8 cups = 2L default) */
export const ML_PER_CUP = 250;
/** 1 oz = 29.5735ml */
export const ML_PER_OZ = 29.5735;

export const DEFAULT_GOAL_ML = 2000; // 8 cups

// ============================================
// Conversion helpers
// ============================================

export function mlToOz(ml: number): number {
  return ml / ML_PER_OZ;
}

export function mlToCups(ml: number): number {
  return ml / ML_PER_CUP;
}

export function ozToMl(oz: number): number {
  return oz * ML_PER_OZ;
}

export function cupsToMl(cups: number): number {
  return cups * ML_PER_CUP;
}

/** Convert ml amount to display string for the given unit */
export function formatWaterAmount(ml: number, unit: WaterUnit, decimals = 1): string {
  switch (unit) {
    case 'oz':
      return `${mlToOz(ml).toFixed(decimals)} oz`;
    case 'cups':
      return `${mlToCups(ml).toFixed(decimals)} cups`;
    default:
      return `${Math.round(ml)} ml`;
  }
}

// ============================================
// Types
// ============================================

interface WaterState {
  /** Today's water log */
  log: WaterLog;
  /** Preferred display unit */
  unit: WaterUnit;
  /** Whether goal has just been hit (triggers celebration) */
  justReachedGoal: boolean;
}

interface WaterActions {
  /** Load from storage; auto-resets if date changed */
  load: () => void;
  /** Add water (in ml) */
  addWater: (ml: number) => void;
  /** Set a new daily goal (in ml) */
  setGoal: (goalMl: number) => void;
  /** Change display unit */
  setUnit: (unit: WaterUnit) => void;
  /** Dismiss the celebration */
  dismissCelebration: () => void;
  /** Reset today's intake */
  reset: () => void;
}

type WaterStore = WaterState & WaterActions;

// ============================================
// Helpers
// ============================================

function todayLog(goalMl: number = DEFAULT_GOAL_ML): WaterLog {
  return { date: formatDateKey(), amountMl: 0, goalMl };
}

// ============================================
// Store
// ============================================

export const useWaterStore = create<WaterStore>((set, get) => ({
  log: todayLog(),
  unit: 'ml',
  justReachedGoal: false,

  load: () => {
    const today = formatDateKey();
    const saved = getWaterLog();
    const savedUnit = getWaterUnit();

    // Midnight reset: if saved log is from a previous day, start fresh
    const log: WaterLog =
      saved && saved.date === today
        ? saved
        : todayLog(saved?.goalMl ?? DEFAULT_GOAL_ML);

    set({
      log,
      unit: savedUnit ?? 'ml',
      justReachedGoal: false,
    });

    // Persist fresh log if we reset
    if (!saved || saved.date !== today) {
      saveWaterLog(log);
    }
  },

  addWater: (ml: number) => {
    const { log } = get();
    const wasUnderGoal = log.amountMl < log.goalMl;
    const newAmount = Math.max(0, log.amountMl + ml);
    const nowAtGoal = newAmount >= log.goalMl;
    const justReachedGoal = wasUnderGoal && nowAtGoal;

    const newLog: WaterLog = { ...log, amountMl: newAmount };
    saveWaterLog(newLog);
    set({ log: newLog, justReachedGoal });
  },

  setGoal: (goalMl: number) => {
    const { log } = get();
    const newLog: WaterLog = { ...log, goalMl };
    saveWaterLog(newLog);
    set({ log: newLog });
  },

  setUnit: (unit: WaterUnit) => {
    saveWaterUnit(unit);
    set({ unit });
  },

  dismissCelebration: () => {
    set({ justReachedGoal: false });
  },

  reset: () => {
    const { log } = get();
    const newLog: WaterLog = { ...log, amountMl: 0 };
    saveWaterLog(newLog);
    set({ log: newLog, justReachedGoal: false });
  },
}));
