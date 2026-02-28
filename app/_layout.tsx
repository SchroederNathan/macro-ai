import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Stack, SplashScreen } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { Appearance, View } from 'react-native'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { SafeAreaListener } from 'react-native-safe-area-context'
import { Uniwind } from 'uniwind'
import '../globals.css'

import '@/polyfills'

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync()

function RootLayoutNav() {
  const { session, isLoading } = useAuth()
  const [colorScheme, setColorScheme] = useState(() => Appearance.getColorScheme())

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setColorScheme(colorScheme)
    })
    return () => subscription.remove()
  }, [])

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync()
    }
  }, [isLoading])

  if (isLoading) {
    return null
  }

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
            <Stack.Protected guard={!!session}>
              <Stack.Screen name="(app)" />
            </Stack.Protected>
            <Stack.Protected guard={!session}>
              <Stack.Screen name="onboarding" />
            </Stack.Protected>
          </Stack>
        </KeyboardProvider>
      </View>
    </SafeAreaListener>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  )
}
