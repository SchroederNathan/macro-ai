import { create } from 'zustand';
import { getDailyLog, saveDailyLog } from '@/lib/storage';
import {
  type DailyLog,
  type FoodLogEntry,
  type MacroTotals,
  EMPTY_MACRO_TOTALS,
  formatDateKey,
  generateEntryId,
  sumMacros,
} from '@/types/nutrition';

// ============================================
// Types
// ============================================

interface DailyLogState {
  /** Current date being viewed (yyyy-mm-dd) */
  currentDate: string;
  /** Current day's log */
  log: DailyLog;
  /** Loading state */
  isLoading: boolean;
}

interface DailyLogActions {
  /** Load log for a specific date */
  load: (date?: string) => void;
  /** Add a food entry */
  addEntry: (entry: Omit<FoodLogEntry, 'id' | 'consumedAt'>) => FoodLogEntry;
  /** Remove a food entry by ID */
  removeEntry: (entryId: string) => void;
  /** Update an existing entry */
  updateEntry: (entryId: string, updates: Partial<Omit<FoodLogEntry, 'id'>>) => void;
  /** Recalculate totals from entries */
  recalcTotals: () => void;
}

type DailyLogStore = DailyLogState & DailyLogActions;

// ============================================
// Helpers
// ============================================

function createEmptyLog(date: string): DailyLog {
  return {
    date,
    entries: [],
    totals: { ...EMPTY_MACRO_TOTALS },
  };
}

function calculateTotals(entries: FoodLogEntry[]): MacroTotals {
  return sumMacros(entries);
}

// ============================================
// Store
// ============================================

export const useDailyLogStore = create<DailyLogStore>((set, get) => ({
  // Initial state
  currentDate: formatDateKey(),
  log: createEmptyLog(formatDateKey()),
  isLoading: false,

  // Actions
  load: (date?: string) => {
    const targetDate = date ?? formatDateKey();
    set({ isLoading: true, currentDate: targetDate });

    const savedLog = getDailyLog(targetDate);
    const log = savedLog ?? createEmptyLog(targetDate);

    set({ log, isLoading: false });
  },

  addEntry: (entryData) => {
    const { log } = get();
    const entry: FoodLogEntry = {
      ...entryData,
      id: generateEntryId(),
      consumedAt: Date.now(),
    };

    const newEntries = [...log.entries, entry];
    const newTotals = calculateTotals(newEntries);
    const newLog: DailyLog = {
      ...log,
      entries: newEntries,
      totals: newTotals,
    };

    // Persist to MMKV
    saveDailyLog(newLog);
    set({ log: newLog });

    return entry;
  },

  removeEntry: (entryId) => {
    const { log } = get();
    const newEntries = log.entries.filter(e => e.id !== entryId);
    const newTotals = calculateTotals(newEntries);
    const newLog: DailyLog = {
      ...log,
      entries: newEntries,
      totals: newTotals,
    };

    // Persist to MMKV
    saveDailyLog(newLog);
    set({ log: newLog });
  },

  updateEntry: (entryId, updates) => {
    const { log } = get();
    const newEntries = log.entries.map(e =>
      e.id === entryId ? { ...e, ...updates } : e
    );
    const newTotals = calculateTotals(newEntries);
    const newLog: DailyLog = {
      ...log,
      entries: newEntries,
      totals: newTotals,
    };

    // Persist to MMKV
    saveDailyLog(newLog);
    set({ log: newLog });
  },

  recalcTotals: () => {
    const { log } = get();
    const newTotals = calculateTotals(log.entries);
    const newLog: DailyLog = {
      ...log,
      totals: newTotals,
    };

    // Persist to MMKV
    saveDailyLog(newLog);
    set({ log: newLog });
  },
}));
