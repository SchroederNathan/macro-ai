import { Text } from '@/components/ui/Text'
import { colors } from '@/constants/colors'
import ChatScreen from '@/screens/ChatScreen'
import HistoryScreen from '@/screens/HistoryScreen'
import HomeScreen from '@/screens/HomeScreen'
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { BlurView } from 'expo-blur'
import { Stack } from 'expo-router'
import { useCallback, useRef } from 'react'
import { ColorSchemeName, StyleSheet, useColorScheme, View } from 'react-native'
import { Haptics } from 'react-native-nitro-haptics'
import PagerView, { PagerViewOnPageScrollEventData } from 'react-native-pager-view'
import Animated, { SharedValue, useAnimatedProps, useSharedValue } from 'react-native-reanimated'

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

const HomeStack = createNativeStackNavigator()
const ChatStack = createNativeStackNavigator()
const HistoryStack = createNativeStackNavigator()

function HomeStackScreen() {
  const colorScheme = useColorScheme()
  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        <HomeStack.Navigator id="home">
          <HomeStack.Screen
            name="HomeScreen"
            component={HomeScreen}
            options={{
              headerTransparent: true,
              headerBlurEffect: undefined,
              headerTitle: () => (
                <Text
                  className="font-serif text-foreground text-2xl font-bold"
                >
                  Dashboard
                </Text>
              ),
              unstable_headerRightItems: () => [
                {
                  type: 'menu',
                  label: 'Options',
                  icon: { type: 'sfSymbol', name: 'calendar' },
                  menu: {
                    title: 'Options',
                    items: [
                      {
                        type: 'action',
                        label: 'Edit',
                        icon: { type: 'sfSymbol', name: 'pencil' },
                        onPress: () => console.log('Edit pressed'),
                      },
                    ],
                  },
                },
              ],
            }}
          />
        </HomeStack.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  )
}

function ChatStackScreen() {
  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        <ChatStack.Navigator id="chat">
          <ChatStack.Screen
            name="ChatScreen"
            component={ChatScreen}
            options={{
              headerTransparent: true,
              headerLargeStyle: { backgroundColor: 'transparent' },
              headerBlurEffect: undefined,
              title: '',

              unstable_headerRightItems: () => [
                {
                  type: 'menu',
                  label: 'Options',
                  icon: { type: 'sfSymbol', name: 'calendar' },
                  menu: {
                    title: 'Options',
                    items: [
                      {
                        type: 'action',
                        label: 'Edit',
                        icon: { type: 'sfSymbol', name: 'pencil' },
                        onPress: () => console.log('Edit pressed'),
                      },
                    ],
                  },
                },
                {
                  type: 'menu',
                  label: 'Options',
                  icon: { type: 'sfSymbol', name: 'ellipsis' },
                  menu: {
                    title: 'Options',
                    items: [
                      {
                        type: 'action',
                        label: 'Edit',
                        icon: { type: 'sfSymbol', name: 'pencil' },
                        onPress: () => console.log('Edit pressed'),
                      },
                    ],
                  },
                },

              ],
            }}
          />
        </ChatStack.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  )
}

function HistoryStackScreen() {
  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        <HistoryStack.Navigator id="history">
          <HistoryStack.Screen
            name="HistoryScreen"
            component={HistoryScreen}
            options={{
              headerTransparent: true,
              headerLargeStyle: { backgroundColor: 'transparent' },
              headerBlurEffect: undefined,
              title: '',
            }}
          />
        </HistoryStack.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  )
}

export default function PagerScreen() {
  const pagerRef = useRef<PagerView>(null)
  const colorScheme = useColorScheme()
  const lastHapticPosition = useRef<number | null>(null)
  const scrollPosition = useSharedValue(1) // Start at initial page

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
      <Stack.Screen options={{ headerShown: false }} />
      <PagerView
        ref={pagerRef}
        style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? colors.dark.background : colors.light.background }}
        initialPage={1}
        onPageScroll={handlePageScroll}
      >
        <View key="home" style={{ flex: 1 }}>
          <BlurredPage pageIndex={0} scrollPosition={scrollPosition} colorScheme={colorScheme}>
            <HomeStackScreen />
          </BlurredPage>
        </View>
        <View key="chat" style={{ flex: 1 }}>
          <BlurredPage pageIndex={1} scrollPosition={scrollPosition} colorScheme={colorScheme}>
            <ChatStackScreen />
          </BlurredPage>
        </View>
        <View key="history" style={{ flex: 1 }}>
          <BlurredPage pageIndex={2} scrollPosition={scrollPosition} colorScheme={colorScheme}>
            <HistoryStackScreen />
          </BlurredPage>
        </View>
      </PagerView>
    </>
  )
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
  },
})
