import { colors } from '@/constants/colors'
import ChatScreen from '@/screens/ChatScreen'
import HistoryScreen from '@/screens/HistoryScreen'
import HomeScreen from '@/screens/HomeScreen'
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Stack } from 'expo-router'
import { useRef } from 'react'
import { useColorScheme, View } from 'react-native'
import PagerView from 'react-native-pager-view'

const HomeStack = createNativeStackNavigator()
const ChatStack = createNativeStackNavigator()
const HistoryStack = createNativeStackNavigator()

function HomeStackScreen() {
  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        <HomeStack.Navigator id="home">
          <HomeStack.Screen
            name="HomeScreen"
            component={HomeScreen}
            options={{
              headerTransparent: true,
              headerLargeStyle: { backgroundColor: 'transparent' },
              headerBlurEffect: undefined,
              title: '',
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
              // @ts-ignore - experimental API
              unstable_headerRightItems: () => [
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

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PagerView
        ref={pagerRef}
        style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? colors.dark.background : colors.light.background }}
        initialPage={1}
      >
        <View key="home" style={{ flex: 1 }}>
          <HomeStackScreen />
        </View>
        <View key="chat" style={{ flex: 1 }}>
          <ChatStackScreen />
        </View>
        <View key="history" style={{ flex: 1 }}>
          <HistoryStackScreen />
        </View>
      </PagerView>
    </>
  )
}
