import { Text } from '@/components/ui/Text'
import { scaleMacros, type FoodLogEntry } from '@/types/nutrition'
import { GlassView } from 'expo-glass-effect'
import { memo, useMemo } from 'react'
import { View } from 'react-native'
import Animated, { FadeInUp } from 'react-native-reanimated'

const MACRO_COLORS = {
  protein: '#22C55E',
  carbs: '#FBBF24',
  fat: '#3B82F6',
}

type FoodEntryCardProps = {
  entry: FoodLogEntry
  index: number
}

export const FoodEntryCard = memo(function FoodEntryCard({ entry, index }: FoodEntryCardProps) {
  const scaled = useMemo(
    () => scaleMacros(entry.snapshot.nutrients, entry.quantity),
    [entry.snapshot.nutrients, entry.quantity]
  )

  const servingText = `${entry.quantity} × ${entry.snapshot.serving.amount} ${entry.snapshot.serving.unit}`

  return (
    <Animated.View entering={FadeInUp.duration(300).delay(index * 50)}>
      <GlassView
      isInteractive
        style={{
          borderRadius: 16,
          borderCurve: 'continuous',
          padding: 14,
        }}
      >
        {/* Top row: name + meal badge */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-foreground text-base font-medium flex-1 mr-2" numberOfLines={1}>
            {entry.snapshot.name}
          </Text>
          {entry.meal && (
            <GlassView style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
              <Text className="text-muted text-xs font-medium">
                {entry.meal.charAt(0).toUpperCase() + entry.meal.slice(1)}
              </Text>
            </GlassView>
          )}
        </View>

        {/* Middle row: calories */}
        <View className="flex-row items-end gap-1 mb-2">
          <Text className="text-foreground text-2xl font-bold">{scaled.calories}</Text>
          <Text className="text-muted text-sm mb-0.5">kcal</Text>
        </View>

        {/* Bottom row: macro chips + serving */}
        <View className="flex-row items-center justify-between">
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
          <Text className="text-muted text-xs">{servingText}</Text>
        </View>
      </GlassView>
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
          <FoodEntryCard key={entry.id} entry={entry} index={index} />
        ))}
      </View>
    </View>
  )
}
