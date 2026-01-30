import { Text } from '@/components/ui/Text'
import { colors } from '@/constants/colors'
import MaskedView from '@react-native-masked-view/masked-view'
import { GlassView } from 'expo-glass-effect'
import { memo, useCallback, useEffect, useState } from 'react'
import { StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native'
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg'
import { Haptics } from 'react-native-nitro-haptics'
import Animated, {
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { carouselRows, type CarouselItem } from './carouselData'

const CARD_GAP = 12
const ESTIMATED_AVG_CARD_WIDTH = 220 // Approximate for animation calculations
const SCROLL_DURATION = 100000 // 100 seconds per full cycle

type CarouselCardProps = {
  item: CarouselItem
  onPress: (text: string) => void
}

const CarouselCard = memo(function CarouselCard({ item, onPress }: CarouselCardProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const handlePress = useCallback(() => {
    Haptics.selection()
    onPress(item.text)
  }, [item.text, onPress])

  return (
    <GlassView
      style={styles.card}
      isInteractive
      onTouchEnd={handlePress}
    >
      <Text className="text-2xl">{item.emoji}</Text>
      <Text
        className="text-sm"
        style={{ color: isDark ? colors.dark.suggestionCardText : colors.light.suggestionCardText }}
        numberOfLines={1}
      >
        {item.text}
      </Text>
    </GlassView>
  )
})

type SingleCarouselProps = {
  items: CarouselItem[]
  reverse?: boolean
  onSelectItem: (text: string) => void
}

const SingleCarousel = memo(function SingleCarousel({ items, reverse = false, onSelectItem }: SingleCarouselProps) {
  // Triple the items for seamless looping
  const tripledItems = [...items, ...items, ...items]
  const totalWidth = items.length * (ESTIMATED_AVG_CARD_WIDTH + CARD_GAP)

  // Initialize at the correct position immediately to prevent jump
  const initialValue = reverse ? -totalWidth : 0
  const targetValue = reverse ? 0 : -totalWidth
  const translateX = useSharedValue(initialValue)

  // Start animation in useEffect to avoid side effects during render
  useEffect(() => {
    translateX.set(withRepeat(
      withTiming(targetValue, {
        duration: SCROLL_DURATION,
        easing: Easing.linear,
      }),
      -1, // infinite
      false // don't reverse
    ))
  }, [reverse, totalWidth, targetValue, translateX])

  // Reset position when reaching boundary for seamless loop
  useAnimatedReaction(
    () => translateX.get(),
    (currentValue) => {
      if (reverse) {
        // Moving right (reverse direction)
        if (currentValue >= 0) {
          translateX.set(-totalWidth)
        }
      } else {
        // Moving left (normal direction)
        if (currentValue <= -totalWidth) {
          translateX.set(0)
        }
      }
    }
  )

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }],
  }))

  return (
    <View className="overflow-visible my-1.5">
      <Animated.View className="flex-row" style={animatedStyle}>
        {tripledItems.map((item, index) => (
          <CarouselCard
            key={`${item.id}-${index}`}
            item={item}
            onPress={onSelectItem}
          />
        ))}
      </Animated.View>
    </View>
  )
})

type EmptyStateCarouselsProps = {
  onSelectItem: (text: string) => void
}

const FADE_WIDTH = 40

function FadeMask({ width, height }: { width: number; height: number }) {
  const fadePercent = (FADE_WIDTH / width) * 100

  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgLinearGradient id="fadeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="black" stopOpacity={0} />
          <Stop offset={`${fadePercent}%`} stopColor="black" stopOpacity={1} />
          <Stop offset={`${100 - fadePercent}%`} stopColor="black" stopOpacity={1} />
          <Stop offset="100%" stopColor="black" stopOpacity={0} />
        </SvgLinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="url(#fadeGradient)" />
    </Svg>
  )
}

export function EmptyStateCarousels({ onSelectItem }: EmptyStateCarouselsProps) {
  const { width } = useWindowDimensions()
  const [contentHeight, setContentHeight] = useState(0)

  const content = (
    <View onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}>
      {carouselRows.map((row, index) => (
        <SingleCarousel
          key={index}
          items={row}
          reverse={index % 2 === 1} // Alternate directions: left, right, left
          onSelectItem={onSelectItem}
        />
      ))}
    </View>
  )

  if (contentHeight === 0) {
    // Render invisibly to measure
    return <View className="py-5" style={{ opacity: 0 }}>{content}</View>
  }

  return (
    <View className="py-5">
      <MaskedView
        style={{ width, height: contentHeight }}
        maskElement={<FadeMask width={width} height={contentHeight} />}
      >
        {content}
      </MaskedView>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
  },
})
