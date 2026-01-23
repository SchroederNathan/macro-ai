import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { Appearance, View } from 'react-native'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { SafeAreaListener } from 'react-native-safe-area-context'
import { Uniwind } from 'uniwind'
import '../globals.css'

import '@/polyfills'

export default function Layout() {
  const [colorScheme, setColorScheme] = useState(Appearance.getColorScheme())

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setColorScheme(colorScheme)
    })
    return () => subscription.remove()
  }, [])

  return (
    <SafeAreaListener
      onChange={({ insets }) => {
        Uniwind.updateInsets(insets)
      }}
    >
      <View className={`flex-1 ${colorScheme === 'dark' ? 'dark' : 'light'}`}>
        <StatusBar style="auto" />
        <KeyboardProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{
              headerShown: true, headerTransparent: true,
              headerLargeStyle: { backgroundColor: 'transparent' },
              headerBlurEffect: undefined,
              title: '',
            }} />
            <Stack.Screen name="pager" options={{
              headerShown: true,
              headerTransparent: true,
              headerLargeStyle: { backgroundColor: 'transparent' },
              headerBlurEffect: undefined,
              title: '',
            }} />
          </Stack>
        </KeyboardProvider>
      </View>
    </SafeAreaListener>
  )
}
