import { Stack } from 'expo-router'
import { View, Appearance } from 'react-native'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import '../globals.css'
import { SafeAreaListener } from 'react-native-safe-area-context'
import { Uniwind } from 'uniwind'

import '@/polyfills';

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
            <Stack.Screen name="index" />
          </Stack>
        </KeyboardProvider>
      </View>
    </SafeAreaListener>
  )
}
