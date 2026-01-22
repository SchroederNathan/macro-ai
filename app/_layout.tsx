import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { Appearance, View } from 'react-native'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { SafeAreaListener } from 'react-native-safe-area-context'
import { Uniwind } from 'uniwind'
import '../globals.css'

import '@/polyfills'
import { GlassView } from 'expo-glass-effect'
import { EllipsisVertical } from 'lucide-react-native'
import { isGlassEffectAPIAvailable } from 'expo-glass-effect'

export default function Layout() {
  const [colorScheme, setColorScheme] = useState(Appearance.getColorScheme())

  const isGlassEffectAvailable = isGlassEffectAPIAvailable()


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
          <Stack>
            <Stack.Screen name="index" options={{
              headerTransparent: true,
              headerLargeStyle: { backgroundColor: 'transparent' },
              title: '',
              headerBlurEffect: undefined,
              unstable_headerRightItems: () => [
                {
                  type: 'menu',
                  label: 'Options',
                  icon: {
                    type: 'sfSymbol',
                    name: 'ellipsis',
                  },
                  menu: {
                    title: 'Options',
                    items: [
                      {
                        type: 'action',
                        label: 'Edit',
                        icon: {
                          type: 'sfSymbol',
                          name: 'pencil',
                        },
                        onPress: () => {
                          // Do something
                        },
                      },

                    ],
                  },
                },
              ],
            }} />
          </Stack>
        </KeyboardProvider>
      </View>
    </SafeAreaListener>
  )
}
