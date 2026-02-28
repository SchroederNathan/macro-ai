import { createContext } from 'react'
import type { FoodDetailCallbacks } from './FoodDetailCallbackContext'
import type { SharedValue } from 'react-native-reanimated'

// Context to share scroll position with child screens
export const ScrollPositionContext = createContext<SharedValue<number> | null>(null)

// Context to allow child screens to navigate the pager
export const PagerNavigationContext = createContext<{
  navigateToPage: (page: number) => void
} | null>(null)

// Context to allow ChatScreen to register its pending entry callbacks
export const FoodDetailCallbackRegistryContext = createContext<{
  setCallbacks: (cbs: FoodDetailCallbacks | null) => void
} | null>(null)
