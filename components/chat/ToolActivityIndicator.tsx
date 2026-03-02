import { FC, useEffect, useRef, useState } from 'react'
import { StyleSheet, useColorScheme, View } from 'react-native'
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
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated'
import MaskedView from '@react-native-masked-view/masked-view'
import { LinearGradient } from 'expo-linear-gradient'

type ToolActivityIndicatorProps = {
  isThinking: boolean
  toolName: string | null
  toolState: string | null
  foodQuery?: string
}

function getDisplayText(
  isThinking: boolean,
  toolName: string | null,
  toolState: string | null,
  foodQuery?: string
): string {
  if (!isThinking && !toolName) return ''

  if (toolState === 'output-available') {
    return 'Finishing up...'
  }

  if (toolName === 'tool-lookup_and_log_food' && foodQuery) {
    return `Looking up ${foodQuery}...`
  }

  if (toolName === 'tool-remove_food_entry' && foodQuery) {
    return `Removing ${foodQuery}...`
  }

  if (toolName === 'tool-update_food_servings' && foodQuery) {
    return `Updating ${foodQuery}...`
  }

  if (toolName === 'tool-ask_user') {
    return 'Asking a question...'
  }

  if (toolName) {
    return 'Searching...'
  }

  return 'Thinking...'
}

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
      withSpring(progress.get(), {
        damping: 100,
        stiffness: 1400,
      })
    )
  }, [index, progress])

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
      <Text className={className}>{char === ' ' ? '\u00A0' : char}</Text>
    </Animated.View>
  )
}

function hexToTransparent(hex: string): string {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, 0)`
}

/** Shimmer overlay for the text */
function ShimmerOverlay({ width, height, color }: { width: number; height: number; color: string }) {
  const translateX = useSharedValue(-width)

  useEffect(() => {
    if (width > 0) {
      translateX.set(withRepeat(
        withSequence(
          withTiming(-width, { duration: 0 }),
          withTiming(width, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      ))
    }
  }, [width, translateX])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }],
  }))

  const transparentColor = hexToTransparent(color)

  return (
    <Animated.View
      style={[{ position: 'absolute', top: 0, left: 0, width, height }, animatedStyle]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={[transparentColor, color, color, transparentColor]}
        locations={[0, 0.4, 0.6, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  )
}

export function ToolActivityIndicator({ isThinking, toolName, toolState, foodQuery }: ToolActivityIndicatorProps) {
  const text = getDisplayText(isThinking, toolName, toolState, foodQuery)
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const progress = useSharedValue(1)
  const [displayText, setDisplayText] = useState(text)
  const prevTextRef = useRef(text)
  const isFirstRender = useRef(true)
  const isTransitioning = useRef(false)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  const isComplete = toolState === 'output-available'

  useEffect(() => {
    // Skip animation on first render
    if (isFirstRender.current) {
      isFirstRender.current = false
      setDisplayText(text)
      prevTextRef.current = text
      // Animate in
      setTimeout(() => {
        progress.set(1)
      }, 50)
      return
    }

    // Skip if text hasn't changed
    if (prevTextRef.current === text) return

    // Skip if already transitioning
    if (isTransitioning.current) {
      setDisplayText(text)
      prevTextRef.current = text
      return
    }

    isTransitioning.current = true

    // Fade out
    progress.set(withTiming(0, { duration: 150 }))

    // Update text after fade out, then stagger in
    setTimeout(() => {
      setDisplayText(text)
      prevTextRef.current = text

      setTimeout(() => {
        progress.set(1)
        isTransitioning.current = false
      }, 50)
    }, 180)
  }, [text, progress])

  if (!text) return null

  const chars = displayText.split('')
  const shimmerColor = isDark ? '#fafafa' : '#71717a'

  return (
    <View className="flex-row items-center">
      <MaskedView
        style={{ height: dimensions.height || 24 }}
        maskElement={
          <View
            className="flex-row"
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout
              setDimensions({ width, height })
            }}
          >
            {chars.map((char, index) => (
              <AnimatedChar
                key={`${displayText}-${index}`}
                char={char}
                index={index}
                totalCount={chars.length}
                progress={progress}
                className="text-base text-muted font-medium"
              />
            ))}
          </View>
        }
      >
        {/* Base color layer */}
        <View
          style={{ width: dimensions.width || 200, height: dimensions.height || 24 }}
          className="bg-muted"
        />
        {/* Shimmer overlay */}
        {!isComplete && dimensions.width > 0 && (
          <ShimmerOverlay
            width={dimensions.width}
            height={dimensions.height}
            color={shimmerColor}
          />
        )}
      </MaskedView>
    </View>
  )
}
