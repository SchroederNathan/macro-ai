import { Text } from '@/components/ui/Text'
import { scaleMacros, type FoodLogEntry } from '@/types/nutrition'
import { GlassView } from 'expo-glass-effect'
import { memo, useEffect, useMemo } from 'react'
import { View } from 'react-native'
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

const MACRO_COLORS = {
  protein: '#22C55E',
  carbs: '#FBBF24',
  fat: '#3B82F6',
}

type MacroSegmentProps = {
  percent: number
  color: string
  position: 'first' | 'middle' | 'last'
}

function MacroSegment({ percent, color, position }: MacroSegmentProps) {
  const flex = useSharedValue(0)

  useEffect(() => {
    flex.set(withSpring(percent))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percent])

  const animatedStyle = useAnimatedStyle(() => ({ flex: flex.value }))

  const borderRadius = position === 'first'
    ? { borderTopLeftRadius: 6, borderBottomLeftRadius: 6, borderTopRightRadius: 3, borderBottomRightRadius: 3 }
    : position === 'last'
      ? { borderTopLeftRadius: 3, borderBottomLeftRadius: 3, borderTopRightRadius: 6, borderBottomRightRadius: 6 }
      : { borderRadius: 3 }

  return (
    <Animated.View style={animatedStyle}>
      <GlassView
        tintColor={color}
        isInteractive
        style={{ height: 16, ...borderRadius }}
      />
    </Animated.View>
  )
}

function MacroBar({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const proteinCals = protein * 4
  const carbsCals = carbs * 4
  const fatCals = fat * 9
  const total = proteinCals + carbsCals + fatCals

  const proteinPct = total > 0 ? (proteinCals / total) * 100 : 33
  const carbsPct = total > 0 ? (carbsCals / total) * 100 : 33
  const fatPct = total > 0 ? (fatCals / total) * 100 : 33

  return (
    <View style={{ flexDirection: 'row', height: 16, gap: 2 }}>
      <MacroSegment percent={proteinPct} color={MACRO_COLORS.protein} position="first" />
      <MacroSegment percent={carbsPct} color={MACRO_COLORS.carbs} position="middle" />
      <MacroSegment percent={fatPct} color={MACRO_COLORS.fat} position="last" />
    </View>
  )
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

  const timeText = new Date(entry.consumedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

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
          <View className="flex-row items-center gap-1.5">
            <Text className="text-muted text-xs">{timeText}</Text>
            {entry.meal && (
              <>
                <Text className="text-muted text-xs">·</Text>
                <Text className="text-muted text-xs font-medium">
                  {entry.meal.charAt(0).toUpperCase() + entry.meal.slice(1)}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Middle row: calories */}
        <View className="flex-row items-end gap-1 mb-3">
          <Text className="text-foreground text-2xl font-bold">{scaled.calories}</Text>
          <Text className="text-muted text-sm mb-0.5">kcal</Text>
        </View>

        {/* Macro bar */}
        <View className="mb-3">
          <MacroBar protein={scaled.protein} carbs={scaled.carbs} fat={scaled.fat} />
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
