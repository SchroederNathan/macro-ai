import { FC, useEffect, useRef, useState } from 'react'
import { Text } from '@/components/ui/Text'
import { View } from 'react-native'
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

type AnimatedCharProps = {
  char: string
  index: number
  totalCount: number
  progress: SharedValue<number>
  className?: string
}

/** Single animated character with staggered spring animation */
const AnimatedChar: FC<AnimatedCharProps> = ({ index, char, progress, totalCount, className }) => {
  const charProgress = useDerivedValue(() => {
    const delayMs = index * 15

    return withDelay(
      delayMs,
      withSpring(progress.value, {
        damping: 100,
        stiffness: 1400,
      })
    )
  }, [])

  const rContainerStyle = useAnimatedStyle(() => {
    const p = charProgress.get()
    const translateX = interpolate(p, [0, 1], [-2, 0])
    const translateY = interpolate(p, [0, 1], [12 - index * (6 / Math.max(totalCount - 1, 1)), 0])
    const scale = interpolate(p, [0, 1], [0.8, 1])

    return {
      opacity: p,
      transform: [
        { translateX },
        { translateY },
        { scale },
      ] as const,
    }
  })

  return (
    <Animated.View style={rContainerStyle}>
      <Text className={className}>{char}</Text>
    </Animated.View>
  )
}

type AnimatedValueProps = {
  value: string | number
  className?: string
  suffix?: string
}

/**
 * Animates text/number values when they change using per-character stagger animation.
 * Fades out old value, updates, then staggers in new value with spring animation.
 */
export const AnimatedValue: FC<AnimatedValueProps> = ({
  value,
  className = 'text-foreground text-base font-semibold',
  suffix = '',
}) => {
  const progress = useSharedValue(1)
  const [displayValue, setDisplayValue] = useState(String(value) + suffix)
  const prevValueRef = useRef(value)
  const isFirstRender = useRef(true)
  const isTransitioning = useRef(false)

  useEffect(() => {
    const newDisplayValue = String(value) + suffix

    // Skip animation on first render
    if (isFirstRender.current) {
      isFirstRender.current = false
      setDisplayValue(newDisplayValue)
      prevValueRef.current = value
      return
    }

    // Skip if value hasn't changed
    if (prevValueRef.current === value) return

    // Skip if already transitioning
    if (isTransitioning.current) {
      setDisplayValue(newDisplayValue)
      prevValueRef.current = value
      return
    }

    isTransitioning.current = true

    // Fade out
    progress.value = withTiming(0, { duration: 150 })

    // Update text after fade out, then fade in
    setTimeout(() => {
      setDisplayValue(newDisplayValue)
      prevValueRef.current = value

      setTimeout(() => {
        progress.value = 1
        isTransitioning.current = false
      }, 50)
    }, 180)
  }, [value, suffix])

  const chars = displayValue.split('')

  return (
    <View className="flex-row">
      {chars.map((char, index) => (
        <AnimatedChar
          key={`${displayValue}-${index}`}
          char={char}
          index={index}
          totalCount={chars.length}
          progress={progress}
          className={className}
        />
      ))}
    </View>
  )
}
