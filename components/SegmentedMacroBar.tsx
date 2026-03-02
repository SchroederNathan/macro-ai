import { useEffect } from 'react'
import { View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'

export const MACRO_COLORS = {
  protein: '#22C55E',
  carbs: '#FBBF24',
  fat: '#3B82F6',
}

type SegmentedMacroBarProps = {
  protein: number
  carbs: number
  fat: number
  height?: number
  gap?: number
  animated?: boolean
}

function computePercents(protein: number, carbs: number, fat: number) {
  const pCals = protein * 4
  const cCals = carbs * 4
  const fCals = fat * 9
  const total = pCals + cCals + fCals
  return {
    protein: total > 0 ? (pCals / total) * 100 : 33,
    carbs: total > 0 ? (cCals / total) * 100 : 33,
    fat: total > 0 ? (fCals / total) * 100 : 33,
  }
}

function AnimatedSegment({ percent, color, style }: { percent: number; color: string; style: object }) {
  const flex = useSharedValue(0)

  useEffect(() => {
    flex.set(withSpring(percent))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percent])

  const animatedStyle = useAnimatedStyle(() => ({ flex: flex.value }))

  return <Animated.View style={[animatedStyle, { backgroundColor: color }, style]} />
}

export function SegmentedMacroBar({
  protein,
  carbs,
  fat,
  height = 24,
  gap = 3,
  animated = false,
}: SegmentedMacroBarProps) {
  const pcts = computePercents(protein, carbs, fat)
  const outerR = Math.ceil(height / 3)
  const innerR = Math.ceil(height / 6)

  const segments = [
    { key: 'protein', flex: pcts.protein, color: MACRO_COLORS.protein, borderRadius: { borderTopLeftRadius: outerR, borderBottomLeftRadius: outerR, borderTopRightRadius: innerR, borderBottomRightRadius: innerR } },
    { key: 'carbs', flex: pcts.carbs, color: MACRO_COLORS.carbs, borderRadius: { borderRadius: innerR } },
    { key: 'fat', flex: pcts.fat, color: MACRO_COLORS.fat, borderRadius: { borderTopLeftRadius: innerR, borderBottomLeftRadius: innerR, borderTopRightRadius: outerR, borderBottomRightRadius: outerR } },
  ]

  return (
    <View style={{ flexDirection: 'row', height, gap }}>
      {segments.map((seg) =>
        animated ? (
          <AnimatedSegment
            key={seg.key}
            percent={seg.flex}
            color={seg.color}
            style={{ height, ...seg.borderRadius }}
          />
        ) : (
          <View
            key={seg.key}
            style={{ flex: seg.flex, backgroundColor: seg.color, height, ...seg.borderRadius }}
          />
        )
      )}
    </View>
  )
}
