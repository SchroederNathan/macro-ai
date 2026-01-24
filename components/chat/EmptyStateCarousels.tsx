import { colors } from '@/constants/colors'
import { BlurView } from 'expo-blur'
import { GlassView } from 'expo-glass-effect'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect } from 'react'
import { Haptics } from 'react-native-nitro-haptics'
import { StyleSheet, useColorScheme, View } from 'react-native'
import MaskedView from '@react-native-masked-view/masked-view'
import Animated, {
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { Text } from '@/components/ui/Text'
import { carouselRows, type CarouselItem } from './carouselData'

const CARD_GAP = 12
const ESTIMATED_AVG_CARD_WIDTH = 220 // Approximate for animation calculations
const SCROLL_DURATION = 100000 // 100 seconds per full cycle

type CarouselCardProps = {
  item: CarouselItem
  onPress: (text: string) => void
}

function CarouselCard({ item, onPress }: CarouselCardProps) {
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
}

type SingleCarouselProps = {
  items: CarouselItem[]
  reverse?: boolean
  onSelectItem: (text: string) => void
}

function SingleCarousel({ items, reverse = false, onSelectItem }: SingleCarouselProps) {
  // Triple the items for seamless looping
  const tripledItems = [...items, ...items, ...items]
  const totalWidth = items.length * (ESTIMATED_AVG_CARD_WIDTH + CARD_GAP)

  const translateX = useSharedValue(reverse ? -totalWidth : 0)

  useEffect(() => {
    const targetValue = reverse ? 0 : -totalWidth
    translateX.value = withRepeat(
      withTiming(targetValue, {
        duration: SCROLL_DURATION,
        easing: Easing.linear,
      }),
      -1, // infinite
      false // don't reverse
    )
  }, [reverse, totalWidth, translateX])

  // Reset position when reaching boundary for seamless loop
  useAnimatedReaction(
    () => translateX.value,
    (currentValue) => {
      if (reverse) {
        // Moving right (reverse direction)
        if (currentValue >= 0) {
          translateX.value = -totalWidth
        }
      } else {
        // Moving left (normal direction)
        if (currentValue <= -totalWidth) {
          translateX.value = 0
        }
      }
    }
  )

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
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
}

type EmptyStateCarouselsProps = {
  onSelectItem: (text: string) => void
}

const FADE_WIDTH = 40

export function EmptyStateCarousels({ onSelectItem }: EmptyStateCarouselsProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const bgColor = isDark ? colors.dark.background : colors.light.background

  return (
    <View className="py-5">
      {carouselRows.map((row, index) => (
        <SingleCarousel
          key={index}
          items={row}
          reverse={index % 2 === 1} // Alternate directions: left, right, left
          onSelectItem={onSelectItem}
        />
      ))}
      {/* Left fade with blur */}
      <MaskedView
        style={[styles.fadeLeft, { width: FADE_WIDTH }]}
        maskElement={
          <LinearGradient
            colors={['#000', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.flex1}
          />
        }
      >
        <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.flex1} />
        <LinearGradient
          colors={[bgColor, bgColor + '00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.absoluteFill}
        />
      </MaskedView>
      {/* Right fade with blur */}
      <MaskedView
        style={[styles.fadeRight, { width: FADE_WIDTH }]}
        maskElement={
          <LinearGradient
            colors={['transparent', '#000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.flex1}
          />
        }
      >
        <LinearGradient
          colors={[bgColor + '00', bgColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.absoluteFill}
        />
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
    marginRight: CARD_GAP,
  },
  fadeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  fadeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  flex1: {
    flex: 1,
  },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
})
