import { create } from 'zustand'
import { getFavorites, saveFavorites } from '@/lib/storage'
import type { FavoriteTemplate, FavoriteTemplateEntry, FoodLogEntry } from '@/types/nutrition'

function normalizeNumber(value: number | undefined): number {
  return Math.round((value ?? 0) * 10) / 10
}

export function buildFavoriteKey(entries: FavoriteTemplateEntry[], mealTitle?: string | null): string {
  const normalizedEntries = [...entries]
    .map(entry => ({
      name: entry.snapshot.name.trim().toLowerCase(),
      quantity: normalizeNumber(entry.quantity),
      meal: entry.meal ?? '',
      servingAmount: normalizeNumber(entry.snapshot.serving.amount),
      servingUnit: entry.snapshot.serving.unit.trim().toLowerCase(),
      servingGramWeight: normalizeNumber(entry.snapshot.serving.gramWeight),
      calories: normalizeNumber(entry.snapshot.nutrients.calories),
      protein: normalizeNumber(entry.snapshot.nutrients.protein),
      carbs: normalizeNumber(entry.snapshot.nutrients.carbs),
      fat: normalizeNumber(entry.snapshot.nutrients.fat),
      fiber: normalizeNumber(entry.snapshot.nutrients.fiber),
      sugar: normalizeNumber(entry.snapshot.nutrients.sugar),
      fdcId: entry.snapshot.fdcId ?? null,
      estimated: Boolean(entry.snapshot.estimated),
    }))
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))

  return JSON.stringify({
    mealTitle: mealTitle?.trim().toLowerCase() ?? '',
    entries: normalizedEntries,
  })
}

export function createFavoriteTemplate(entries: FavoriteTemplateEntry[], mealTitle?: string | null): FavoriteTemplate {
  const key = buildFavoriteKey(entries, mealTitle)
  const isMeal = entries.length > 1

  return {
    id: key,
    key,
    type: isMeal ? 'meal' : 'item',
    title: mealTitle?.trim() || entries[0]?.snapshot.name || 'Favorite',
    mealTitle: mealTitle ?? undefined,
    createdAt: Date.now(),
    entries,
  }
}

export function entriesFromLoggedFood(entries: FoodLogEntry[]): FavoriteTemplateEntry[] {
  return entries.map(entry => ({
    quantity: entry.quantity,
    snapshot: entry.snapshot,
    meal: entry.meal,
  }))
}

type FavoritesState = {
  favorites: FavoriteTemplate[]
  isLoaded: boolean
}

type FavoritesActions = {
  load: () => void
  addFavorite: (entries: FavoriteTemplateEntry[], mealTitle?: string | null) => FavoriteTemplate
  removeFavorite: (favoriteId: string) => void
  toggleFavorite: (entries: FavoriteTemplateEntry[], mealTitle?: string | null) => { isFavorite: boolean; favoriteId: string }
  findFavoriteId: (entries: FavoriteTemplateEntry[], mealTitle?: string | null) => string | null
}

export const useFavoritesStore = create<FavoritesState & FavoritesActions>((set, get) => ({
  favorites: [],
  isLoaded: false,

  load: () => {
    set({ favorites: getFavorites(), isLoaded: true })
  },

  addFavorite: (entries, mealTitle) => {
    const favorite = createFavoriteTemplate(entries, mealTitle)
    const nextFavorites = [
      favorite,
      ...get().favorites.filter(existing => existing.id !== favorite.id),
    ]
    saveFavorites(nextFavorites)
    set({ favorites: nextFavorites, isLoaded: true })
    return favorite
  },

  removeFavorite: favoriteId => {
    const nextFavorites = get().favorites.filter(favorite => favorite.id !== favoriteId)
    saveFavorites(nextFavorites)
    set({ favorites: nextFavorites, isLoaded: true })
  },

  toggleFavorite: (entries, mealTitle) => {
    const favoriteId = buildFavoriteKey(entries, mealTitle)
    const existing = get().favorites.find(favorite => favorite.id === favoriteId)

    if (existing) {
      get().removeFavorite(favoriteId)
      return { isFavorite: false, favoriteId }
    }

    get().addFavorite(entries, mealTitle)
    return { isFavorite: true, favoriteId }
  },

  findFavoriteId: (entries, mealTitle) => {
    const favoriteId = buildFavoriteKey(entries, mealTitle)
    return get().favorites.some(favorite => favorite.id === favoriteId) ? favoriteId : null
  },
}))
