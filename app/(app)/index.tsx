import { colors } from '@/constants/colors'
import ChatScreen from '@/screens/ChatScreen'
import HistoryScreen from '@/screens/HistoryScreen'
import HomeScreen from '@/screens/HomeScreen'
import { NavigationContainer, NavigationIndependentTree, useNavigation } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { BlurView } from 'expo-blur'
import { GlassView } from 'expo-glass-effect'
import { MeshGradientView } from 'expo-mesh-gradient'
import { Stack } from 'expo-router'
import { createContext, useCallback, useContext, useEffect, useRef } from 'react'
import { ColorSchemeName, Dimensions, StyleSheet, useColorScheme, View } from 'react-native'
import { Haptics } from 'react-native-nitro-haptics'
import PagerView, { PagerViewOnPageScrollEventData } from 'react-native-pager-view'
import Animated, { interpolate, SharedValue, useAnimatedProps, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'

const SCREEN_WIDTH = Dimensions.get('window').width

// Context to share scroll position with child screens
export const ScrollPositionContext = createContext<SharedValue<number> | null>(null)

// Page indicator constants
const PAGE_NAMES = ['Dashboard', 'Chat', 'History']
const DOT_SIZE = 8
const PILL_HEIGHT = 28

// Approximate pill widths for each page name (text width + padding)
const PILL_WIDTHS: Record<string, number> = {
  Dashboard: 95,
  Chat: 58,
  History: 72,
}

const AnimatedGlassView = Animated.createAnimatedComponent(GlassView)
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

const MAX_BLUR = 10

type BlurredPageProps = {
  pageIndex: number
  scrollPosition: SharedValue<number>
  children: React.ReactNode
  colorScheme: ColorSchemeName
}

function BlurredPage({ pageIndex, scrollPosition, children, colorScheme }: BlurredPageProps) {
  const animatedProps = useAnimatedProps(() => {
    const distance = Math.abs(scrollPosition.value - pageIndex)
    const intensity = Math.min(distance * MAX_BLUR, MAX_BLUR)
    return { intensity }
  })

  return (
    <View style={styles.pageContainer}>
      {children}
      <AnimatedBlurView
        animatedProps={animatedProps}
        style={StyleSheet.absoluteFill}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        pointerEvents="none"
      />
    </View>
  )
}

type PageIndicatorProps = {
  name: string
  pageIndex: number
  scrollPosition: SharedValue<number>
}

function PageIndicator({ name, pageIndex, scrollPosition }: PageIndicatorProps) {
  const pillWidth = PILL_WIDTHS[name] || 80

  const containerStyle = useAnimatedStyle(() => {
    const distance = Math.abs(scrollPosition.value - pageIndex)
    const progress = Math.max(0, 1 - distance)

    return {
      width: interpolate(progress, [0, 1], [DOT_SIZE, pillWidth]),
      height: interpolate(progress, [0, 1], [DOT_SIZE, PILL_HEIGHT]),
      opacity: interpolate(progress, [0, 1], [0.4, 1]),
    }
  })

  const textStyle = useAnimatedStyle(() => {
    const distance = Math.abs(scrollPosition.value - pageIndex)
    const progress = Math.max(0, 1 - distance)

    return {
      opacity: interpolate(progress, [0, 0.6, 1], [0, 0, 1]),
    }
  })

  return (
    <AnimatedGlassView
      style={[
        {
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
        },
        containerStyle,
      ]}
      isInteractive
    >
      <Animated.Text style={[{ color: 'white', fontSize: 14, fontWeight: '500' }, textStyle]}>
        {name}
      </Animated.Text>
    </AnimatedGlassView>
  )
}

function AnimatedHeaderTitle() {
  const scrollPosition = useContext(ScrollPositionContext)
  if (!scrollPosition) return null

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      {PAGE_NAMES.map((name, index) => (
        <PageIndicator key={name} name={name} pageIndex={index} scrollPosition={scrollPosition} />
      ))}
    </View>
  )
}

function AnimatedMeshBackground({ scrollPosition }: { scrollPosition: SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => ({
    // scrollPosition 0 = Dashboard (fully visible), 1+ = faded out
    opacity: interpolate(scrollPosition.value, [0, 1], [1, 0], 'clamp'),
  }))

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]} pointerEvents="none">
      <MeshGradientView
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 500 }}
        columns={3}
        rows={3}
        colors={[
          '#3b82f6', '#2563eb', '#1e3a8a10',
          '#1e40af70', '#1e3a8a30', '#1e3a8a10',
          'transparent', 'transparent', 'transparent',
        ]}
        points={[
          [0.0, 0.0], [0.5, 0.0], [1.0, 0.0],
          [0.0, 0.5], [0.5, 0.5], [1.0, 0.5],
          [0.0, 1.0], [0.5, 1.0], [1.0, 1.0],
        ]}
      />
    </Animated.View>
  )
}

function AnimatedChatGradient({ scrollPosition }: { scrollPosition: SharedValue<number> }) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const animatedStyle = useAnimatedStyle(() => ({
    // scrollPosition 1 = Chat (fully visible), fade out when swiping away
    opacity: interpolate(Math.abs(scrollPosition.value - 1), [0, 1], [1, 0], 'clamp'),
  }))

  return (
    <Animated.View
      style={[{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 }, animatedStyle]}
      pointerEvents="none"
    >
      <Svg style={{ width: SCREEN_WIDTH, height: 100 }}>
        <Defs>
          <RadialGradient id="chatGrad" cx="50%" cy="100%" r="100%">
            <Stop offset="0%" stopColor={isDark ? colors.dark.primary : colors.light.primary} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={isDark ? colors.dark.background : colors.light.background} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#chatGrad)" />
      </Svg>
    </Animated.View>
  )
}

const AppStack = createNativeStackNavigator()

function PagerContent({ scrollPosition }: { scrollPosition: SharedValue<number> }) {
  const navigation = useNavigation()
  const pagerRef = useRef<PagerView>(null)
  const colorScheme = useColorScheme()
  const lastHapticPosition = useRef<number | null>(null)

  // Update header options when scroll position changes
  useEffect(() => {
    const updateHeader = () => {
      const currentPage = Math.round(scrollPosition.value)
      navigation.setOptions({
        headerRight: currentPage === 1 ? () => null : undefined,
      })
    }

    // Initial update
    updateHeader()
  }, [navigation, scrollPosition])

  const handlePageScroll = useCallback((e: { nativeEvent: PagerViewOnPageScrollEventData }) => {
    const { position, offset } = e.nativeEvent

    // Calculate effective position (position + offset gives us a continuous value)
    const effectivePosition = position + offset

    // Update shared value for blur animation
    scrollPosition.value = effectivePosition

    // Round to nearest 0.5 to detect crossing the halfway point
    const roundedHalf = Math.round(effectivePosition * 2) / 2

    // Only trigger haptic when crossing a .5 boundary (halfway between pages)
    if (roundedHalf % 1 === 0.5 && lastHapticPosition.current !== roundedHalf) {
      lastHapticPosition.current = roundedHalf
      Haptics.impact('soft')
    }

    // Reset when we land on a page
    if (offset === 0) {
      lastHapticPosition.current = null
    }
  }, [scrollPosition])

  return (
    <>
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={1}
        onPageScroll={handlePageScroll}
      >
        <View key="home" style={{ flex: 1 }}>
          <BlurredPage pageIndex={0} scrollPosition={scrollPosition} colorScheme={colorScheme}>
            <HomeScreen />
          </BlurredPage>
        </View>
        <View key="chat" style={{ flex: 1 }}>
          <BlurredPage pageIndex={1} scrollPosition={scrollPosition} colorScheme={colorScheme}>
            <ChatScreen />
          </BlurredPage>
        </View>
        <View key="history" style={{ flex: 1 }}>
          <BlurredPage pageIndex={2} scrollPosition={scrollPosition} colorScheme={colorScheme}>
            <HistoryScreen />
          </BlurredPage>
        </View>
      </PagerView>
    </>
  )
}

export default function PagerScreen() {
  const scrollPosition = useSharedValue(1) // Start at initial page (Chat)
  const colorScheme = useColorScheme()

  return (
    <ScrollPositionContext.Provider value={scrollPosition}>
      <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? colors.dark.background : colors.light.background }}>
        <AnimatedMeshBackground scrollPosition={scrollPosition} />
        <NavigationIndependentTree>
          <NavigationContainer>
            <AppStack.Navigator id="app">
              <AppStack.Screen
                name="Main"
                options={{
                  headerTransparent: true,
                  headerLargeStyle: { backgroundColor: 'transparent' },
                  headerShadowVisible: false,        // iOS: hide bottom shadow
                  headerBlurEffect: undefined,
                  headerTitle: () => <AnimatedHeaderTitle />,

                  contentStyle: { backgroundColor: 'transparent' },
                }}
              >
                {() => {
                  return (
                    <>
                      <Stack.Toolbar placement="right" >
                        <Stack.Toolbar.Menu>
                          <Stack.Toolbar.Icon sf="sparkles" />
                          <Stack.Toolbar.Label>Test menui</Stack.Toolbar.Label>
                          <Stack.Toolbar.MenuAction onPress={() => { }}>Action 1</Stack.Toolbar.MenuAction>
                        </Stack.Toolbar.Menu>
                      </Stack.Toolbar>
                      <PagerContent scrollPosition={scrollPosition} />
                    </>
                  )
                }}
              </AppStack.Screen>
            </AppStack.Navigator>
          </NavigationContainer>
        </NavigationIndependentTree>
        <AnimatedChatGradient scrollPosition={scrollPosition} />
      </View>
    </ScrollPositionContext.Provider >
  )
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
  },
})
