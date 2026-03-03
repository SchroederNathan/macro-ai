import { MACRO_COLORS, SegmentedMacroBar } from '@/components/SegmentedMacroBar'
import { GradientBorderCard } from '@/components/ui/GradientBorderCard'
import { Text } from '@/components/ui/Text'
import { scaleMacros, type FoodLogEntry } from '@/types/nutrition'

import { useRouter } from 'expo-router'
import { Beef, Droplet, Wheat } from 'lucide-react-native'
import { memo, useCallback, useMemo } from 'react'
import { Pressable, View } from 'react-native'
import { Haptics } from 'react-native-nitro-haptics'
import Animated, {
  FadeInUp,
  LinearTransition,
} from 'react-native-reanimated'

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
            {entry.meal ? (
              <Text className="text-muted text-xs">
                {entry.meal.charAt(0).toUpperCase() + entry.meal.slice(1)}
              </Text>
            ) : null}
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
          <View style={{ marginBottom: 12 }}>
            <SegmentedMacroBar protein={scaled.protein} carbs={scaled.carbs} fat={scaled.fat} height={16} gap={2} />
          </View>

          {/* Bottom row: macro chips */}
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <Beef size={12} color={MACRO_COLORS.protein} />
              <Text className="text-muted text-xs">{scaled.protein}g</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Wheat size={12} color={MACRO_COLORS.carbs} />
              <Text className="text-muted text-xs">{scaled.carbs}g</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Droplet size={12} color={MACRO_COLORS.fat} />
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
