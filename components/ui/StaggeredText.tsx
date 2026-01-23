import { FC, useEffect, useRef, useState } from 'react'
import { Text } from 'react-native'
import Animated, {
  interpolate,
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
  progress: Animated.SharedValue<number>
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
    return {
      opacity: charProgress.get(),
      transform: [
        {
          translateX: interpolate(charProgress.get(), [0, 1], [-2, 0]),
        },
        {
          translateY: interpolate(
            charProgress.get(),
            [0, 1],
            [12 - index * (6 / Math.max(totalCount - 1, 1)), 0]
          ),
        },
        {
          scale: interpolate(charProgress.get(), [0, 1], [0.8, 1]),
        },
      ],
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
  className = 'text-base text-zinc-500',
}) => {
  const progress = useSharedValue(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isTransitioning = useRef(false)

  useEffect(() => {
    if (visible) {
      // Show initial text
      const showTimeout = setTimeout(() => {
        progress.value = 1
      }, 100)

      // Start cycling through phrases
      intervalRef.current = setInterval(() => {
        if (isTransitioning.current) return
        isTransitioning.current = true

        // Fade out
        progress.value = withTiming(0, { duration: 200 })

        // Update text after fade out
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % phrases.length)

          // Fade in after text update
          setTimeout(() => {
            progress.value = 1
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
      progress.value = 0
      setCurrentIndex(0)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [visible, phrases.length, intervalMs])

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
