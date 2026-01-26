import { useEffect, useMemo } from 'react'
import { View } from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated'

type ToolActivityIndicatorProps = {
  isThinking: boolean
  toolName: string | null
  toolState: string | null
  foodQuery?: string
}

function getDisplayText(isThinking: boolean, toolName: string | null, toolState: string | null, foodQuery?: string): string {
  if (!isThinking && !toolName) return ''

  // Tool is complete
  if (toolState === 'output-available') {
    return 'Finishing up...'
  }

  // Tool is active - show what we're doing
  if (toolName === 'tool-lookup_and_log_food' && foodQuery) {
    return `Looking up ${foodQuery}`
  }

  if (toolName) {
    return 'Searching'
  }

  // Just thinking, no tool yet
  return 'Thinking'
}

/** Single animated character with staggered fade-in and shimmer */
function AnimatedChar({ char, index, totalChars }: { char: string; index: number; totalChars: number }) {
  const opacity = useSharedValue(0)
  const shimmer = useSharedValue(0)

  useEffect(() => {
    // Staggered fade in - each char delayed by 30ms
    opacity.value = withDelay(
      index * 30,
      withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) })
    )

    // Shimmer effect - continuous pulse with stagger
    shimmer.value = withDelay(
      index * 50,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    )
  }, [index])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      opacity.value,
      [0, 1],
      [0, interpolate(shimmer.value, [0, 1], [0.4, 1])]
    ),
  }))

  return (
    <Animated.Text
      style={animatedStyle}
      className="text-base text-muted font-medium"
    >
      {char === ' ' ? '\u00A0' : char}
    </Animated.Text>
  )
}

/** Animated dots that pulse */
function AnimatedDots() {
  const dot1 = useSharedValue(0)
  const dot2 = useSharedValue(0)
  const dot3 = useSharedValue(0)

  useEffect(() => {
    const duration = 400
    const delay = 150

    dot1.value = withRepeat(
      withSequence(
        withTiming(1, { duration }),
        withTiming(0.3, { duration })
      ),
      -1,
      true
    )

    dot2.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration }),
          withTiming(0.3, { duration })
        ),
        -1,
        true
      )
    )

    dot3.value = withDelay(
      delay * 2,
      withRepeat(
        withSequence(
          withTiming(1, { duration }),
          withTiming(0.3, { duration })
        ),
        -1,
        true
      )
    )
  }, [])

  const style1 = useAnimatedStyle(() => ({ opacity: dot1.value }))
  const style2 = useAnimatedStyle(() => ({ opacity: dot2.value }))
  const style3 = useAnimatedStyle(() => ({ opacity: dot3.value }))

  return (
    <View className="flex-row">
      <Animated.Text style={style1} className="text-base text-muted font-medium">.</Animated.Text>
      <Animated.Text style={style2} className="text-base text-muted font-medium">.</Animated.Text>
      <Animated.Text style={style3} className="text-base text-muted font-medium">.</Animated.Text>
    </View>
  )
}

export function ToolActivityIndicator({ isThinking, toolName, toolState, foodQuery }: ToolActivityIndicatorProps) {
  const text = getDisplayText(isThinking, toolName, toolState, foodQuery)

  // Memoize characters to prevent re-creating on every render
  const chars = useMemo(() => text.split(''), [text])

  if (!text) return null

  const isComplete = toolState === 'output-available'

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      className="flex-row items-center py-2"
      key={text} // Re-mount when text changes to restart animations
    >
      <View className="flex-row flex-wrap">
        {chars.map((char, i) => (
          <AnimatedChar key={`${text}-${i}`} char={char} index={i} totalChars={chars.length} />
        ))}
      </View>
      {!isComplete && <AnimatedDots />}
    </Animated.View>
  )
}
