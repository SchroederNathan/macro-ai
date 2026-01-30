import { FC, useEffect, useRef, useState } from 'react'
import { Text } from '@/components/ui/Text'
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
    const progress = charProgress.get()
    const translateX = interpolate(progress, [0, 1], [-2, 0])
    const translateY = interpolate(progress, [0, 1], [12 - index * (6 / Math.max(totalCount - 1, 1)), 0])
    const scale = interpolate(progress, [0, 1], [0.8, 1])
    
    return {
      opacity: progress,
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

export type StaggeredTextProps = {
  phrases: string[]
  visible: boolean
  intervalMs?: number
  className?: string
}

export const StaggeredText: FC<StaggeredTextProps> = ({
  phrases,
  visible,
  intervalMs = 3000,
  className = 'text-base text-muted',
}) => {
  const progress = useSharedValue(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isTransitioning = useRef(false)

  useEffect(() => {
    if (visible) {
      // Show initial text
      const showTimeout = setTimeout(() => {
        progress.set(1)
      }, 100)

      // Start cycling through phrases
      intervalRef.current = setInterval(() => {
        if (isTransitioning.current) return
        isTransitioning.current = true

        // Fade out
        progress.set(withTiming(0, { duration: 200 }))

        // Update text after fade out
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % phrases.length)

          // Fade in after text update
          setTimeout(() => {
            progress.set(1)
            isTransitioning.current = false
          }, 50)
        }, 250)
      }, intervalMs)

      return () => {
        clearTimeout(showTimeout)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    } else {
      progress.set(0)
      setCurrentIndex(0)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [visible, phrases.length, intervalMs, progress])

  if (!visible) return null

  const currentPhrase = phrases[currentIndex]

  return (
    <Animated.View className="flex-row flex-wrap">
      {currentPhrase.split('').map((char, index) => (
        <AnimatedChar
          key={`${currentIndex}-${index}`}
          char={char}
          index={index}
          totalCount={currentPhrase.length}
          progress={progress}
          className={className}
        />
      ))}
    </Animated.View>
  )
}
