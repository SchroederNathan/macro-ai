import { createContext, useContext } from 'react'

export type FoodDetailCallbacks = {
  onPendingEntryUpdate: (index: number, updates: { quantity: number }) => void
  onPendingEntryRemove: (index: number) => void
}

export const FoodDetailCallbackContext = createContext<FoodDetailCallbacks | null>(null)

export function useFoodDetailCallbacks() {
  return useContext(FoodDetailCallbackContext)
}
