import { useState, useEffect } from 'react'
import { StyleSheet, Text, View, TextProps } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withSequence,
  EasingFunction,
  EasingFunctionFactory,
} from 'react-native-reanimated'
import MaskedView from '@react-native-masked-view/masked-view'
import { LinearGradient } from 'expo-linear-gradient'

// Helper to convert hex color to transparent version
function hexToTransparent(hex: string): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '')
  // Parse the hex values
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, 0)`
}

type ShimmerTextProps = TextProps & {
  children: React.ReactNode
  speed?: number
  easing?: EasingFunction | EasingFunctionFactory
  highlightColor?: string
}

export function ShimmerText({
  children,
  className,
  speed = 0.6,
  easing = Easing.in(Easing.ease),
  highlightColor = '#ffffff',
  ...textProps
}: ShimmerTextProps) {
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)

  const translateX = useSharedValue(-width)

  // Convert speed (shimmers per second) to duration in milliseconds per shimmer
  const duration = 500 / speed

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    }
  })

  useEffect(() => {
    translateX.set(
      withRepeat(
        withSequence(
          withTiming(-width, { duration: 0 }),
          withTiming(width, { duration, easing })
        ),
        -1,
        false
      )
    )
  }, [duration, easing, translateX, width])

  const highlightColorTransparent = hexToTransparent(highlightColor)

  return (
    <View>
      {/* Hidden text to measure dimensions */}
      <Text
        className={`absolute top-0 left-0 self-start pointer-events-none ${className}`}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout
          setWidth(width)
          setHeight(height)
        }}
      >
        {children}
      </Text>
      <MaskedView
        style={{ width, height }}
        maskElement={
          <View className="bg-transparent">
            <Text className={className}>{children}</Text>
          </View>
        }
      >
        <Animated.View style={[{ width, height }, animatedStyle]}>
          <LinearGradient
            colors={[
              highlightColorTransparent,
              highlightColor,
              highlightColor,
              highlightColorTransparent,
            ]}
            locations={[0, 0.4, 0.6, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </MaskedView>
    </View>
  )
}
