import { Text } from '@/components/ui/Text'
import { scaleMacros, type FoodLogEntry } from '@/types/nutrition'
import { GlassView } from 'expo-glass-effect'
import { Minus, Plus, Trash2 } from 'lucide-react-native'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, useColorScheme, View } from 'react-native'
import { Haptics } from 'react-native-nitro-haptics'
import Animated, {
  FadeInUp,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

const MACRO_COLORS = {
  protein: '#22C55E',
  carbs: '#FBBF24',
  fat: '#3B82F6',
}

const cardLayoutTransition = LinearTransition.springify()

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
  onRemove?: (entryId: string) => void
  onQuantityChange?: (entryId: string, newQuantity: number) => void
}

const FoodEntryCard = memo(function FoodEntryCard({ entry, index, onRemove, onQuantityChange }: FoodEntryCardProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const [expanded, setExpanded] = useState(false)

  const scaled = useMemo(
    () => scaleMacros(entry.snapshot.nutrients, entry.quantity),
    [entry.snapshot.nutrients, entry.quantity]
  )

  const timeText = new Date(entry.consumedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  const handlePress = useCallback(() => {
    Haptics.selection()
    setExpanded(prev => !prev)
  }, [])

  const handleIncrement = useCallback(() => {
    Haptics.selection()
    onQuantityChange?.(entry.id, entry.quantity + 1)
  }, [entry.id, entry.quantity, onQuantityChange])

  const handleDecrement = useCallback(() => {
    Haptics.selection()
    if (entry.quantity <= 1) {
      onRemove?.(entry.id)
    } else {
      onQuantityChange?.(entry.id, entry.quantity - 1)
    }
  }, [entry.id, entry.quantity, onQuantityChange, onRemove])

  const handleRemove = useCallback(() => {
    Haptics.notification('warning')
    onRemove?.(entry.id)
  }, [entry.id, onRemove])

  return (
    <Animated.View entering={FadeInUp.duration(300).delay(index * 50)} layout={cardLayoutTransition}>
      <Pressable onPress={handlePress}>
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

          {/* Calories */}
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

          {/* Expanded: quantity controls + delete */}
          {expanded && (
            <Animated.View
              layout={cardLayoutTransition}
              className="flex-row items-center justify-between mt-4 pt-3"
              style={{ borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
            >
              {/* Quantity controls */}
              <View className="flex-row items-center gap-3">
                <Pressable
                  onPress={handleDecrement}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  className="w-8 h-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
                >
                  <Minus size={16} color={isDark ? '#fff' : '#000'} />
                </Pressable>
                <Text className="text-foreground text-lg font-semibold w-8 text-center">
                  {entry.quantity}
                </Text>
                <Pressable
                  onPress={handleIncrement}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  className="w-8 h-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
                >
                  <Plus size={16} color={isDark ? '#fff' : '#000'} />
                </Pressable>
                <Text className="text-muted text-sm">
                  {entry.snapshot.serving.amount * entry.quantity} {entry.snapshot.serving.unit}
                </Text>
              </View>

              {/* Delete */}
              <Pressable
                onPress={handleRemove}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="w-8 h-8 items-center justify-center rounded-full"
                style={{ backgroundColor: 'rgba(239,68,68,0.15)' }}
              >
                <Trash2 size={16} color="#EF4444" />
              </Pressable>
            </Animated.View>
          )}
        </GlassView>
      </Pressable>
    </Animated.View>
  )
})

type FoodHistoryProps = {
  entries: FoodLogEntry[]
  onRemove?: (entryId: string) => void
  onQuantityChange?: (entryId: string, newQuantity: number) => void
}

export function FoodHistory({ entries, onRemove, onQuantityChange }: FoodHistoryProps) {
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
            onRemove={onRemove}
            onQuantityChange={onQuantityChange}
          />
        ))}
      </View>
    </View>
  )
}
