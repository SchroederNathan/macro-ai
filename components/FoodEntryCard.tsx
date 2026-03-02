import { GradientBorderCard } from '@/components/ui/GradientBorderCard'
import { Text } from '@/components/ui/Text'
import { scaleMacros, type FoodLogEntry } from '@/types/nutrition'

import { useRouter } from 'expo-router'
import { memo, useCallback, useMemo } from 'react'
import { Pressable, View } from 'react-native'
import { Haptics } from 'react-native-nitro-haptics'
import Animated, {
  FadeInUp,
  LinearTransition,
} from 'react-native-reanimated'

const MACRO_COLORS = {
  protein: '#22C55E',
  carbs: '#FBBF24',
  fat: '#3B82F6',
}

const cardLayoutTransition = LinearTransition.springify()

type FoodEntryCardProps = {
  entry: FoodLogEntry
  index: number
}

const FoodEntryCard = memo(function FoodEntryCard({ entry, index }: FoodEntryCardProps) {
  const router = useRouter()

  const scaled = useMemo(
    () => scaleMacros(entry.snapshot.nutrients, entry.quantity),
    [entry.snapshot.nutrients, entry.quantity]
  )

  const macroPcts = useMemo(() => {
    const pCals = scaled.protein * 4
    const cCals = scaled.carbs * 4
    const fCals = scaled.fat * 9
    const total = pCals + cCals + fCals
    return {
      protein: total > 0 ? (pCals / total) * 100 : 33,
      carbs: total > 0 ? (cCals / total) * 100 : 33,
      fat: total > 0 ? (fCals / total) * 100 : 33,
    }
  }, [scaled])

  const timeText = new Date(entry.consumedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  const handlePress = useCallback(() => {
    Haptics.selection()
    router.push({ pathname: '/(app)/food-detail', params: { mode: 'logged', entryId: entry.id } })
  }, [router, entry.id])

  return (
    <Animated.View
      entering={FadeInUp.duration(300).delay(index * 50)}
      layout={cardLayoutTransition}
    >
      <Pressable onPress={handlePress}>
        <GradientBorderCard borderRadius={16} padding={14}>
          {/* Top row: name + time/meal */}
          <View className="flex-row items-center justify-between mb-2">
            <Text
              className="text-foreground text-base font-medium flex-1 mr-2 font-serif"
              numberOfLines={1}
            >
              {entry.snapshot.name}
            </Text>
            <Text className="text-muted text-xs">
              {timeText}{entry.meal ? ` · ${entry.meal.charAt(0).toUpperCase() + entry.meal.slice(1)}` : ''}
            </Text>
          </View>

          {/* Calories */}
          <View className="flex-row items-end gap-1 mb-3">
            <Text className="text-foreground text-2xl font-bold font-serif">
              {scaled.calories}
            </Text>
            <Text className="text-muted text-sm mb-0.5">
              kcal
            </Text>
          </View>

          {/* Macro bar */}
          <View style={{ flexDirection: 'row', height: 16, gap: 2, marginBottom: 12 }}>
            <View
              style={{ flex: macroPcts.protein, backgroundColor: MACRO_COLORS.protein, height: 16, borderTopLeftRadius: 6, borderBottomLeftRadius: 6, borderTopRightRadius: 3, borderBottomRightRadius: 3 }}
            />
            <View
              style={{ flex: macroPcts.carbs, backgroundColor: MACRO_COLORS.carbs, height: 16, borderRadius: 3 }}
            />
            <View
              style={{ flex: macroPcts.fat, backgroundColor: MACRO_COLORS.fat, height: 16, borderTopLeftRadius: 3, borderBottomLeftRadius: 3, borderTopRightRadius: 6, borderBottomRightRadius: 6 }}
            />
          </View>

          {/* Bottom row: macro chips */}
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <View style={{ backgroundColor: MACRO_COLORS.protein, width: 7, height: 7, borderRadius: 4 }} />
              <Text className="text-muted text-xs">{scaled.protein}g</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View style={{ backgroundColor: MACRO_COLORS.carbs, width: 7, height: 7, borderRadius: 4 }} />
              <Text className="text-muted text-xs">{scaled.carbs}g</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View style={{ backgroundColor: MACRO_COLORS.fat, width: 7, height: 7, borderRadius: 4 }} />
              <Text className="text-muted text-xs">{scaled.fat}g</Text>
            </View>
          </View>
        </GradientBorderCard>
      </Pressable>
    </Animated.View>
  )
})

type FoodHistoryProps = {
  entries: FoodLogEntry[]
}

export function FoodHistory({ entries }: FoodHistoryProps) {
  if (entries.length === 0) {
    return (
      <View className="items-center py-8">
        <Text className="text-muted text-sm">No food logged yet</Text>
      </View>
    )
  }

  return (
    <View>
      <Text className="text-muted text-xs uppercase tracking-wider font-bold mb-3">
        Food Log
      </Text>
      <View style={{ gap: 10 }}>
        {entries.map((entry, index) => (
          <FoodEntryCard
            key={entry.id}
            entry={entry}
            index={index}
          />
        ))}
      </View>
    </View>
  )
}
