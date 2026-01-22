import { GlassView } from 'expo-glass-effect'
import { useRef, useState } from 'react'
import { Platform, Pressable, TextInput, type TextInputProps, useColorScheme, View } from 'react-native'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Haptics } from 'react-native-nitro-haptics';

import { ArrowUp, Mic } from 'lucide-react-native'

const AnimatedGlassView = Animated.createAnimatedComponent(GlassView)

export const MIN_INPUT_HEIGHT = 56
const MAX_INPUT_HEIGHT = 112

export type AnimatedInputProps = TextInputProps & {
  onSend: (text: string) => void
}

export function AnimatedInput({ onSend, value: valueProp, onChangeText, ...textInputProps }: AnimatedInputProps) {
  const [value, setValue] = useState('')
  const isControlled = valueProp !== undefined
  const inputValue = isControlled ? String(valueProp) : value

  const textInputRef = useRef<TextInput>(null)
  const insets = useSafeAreaInsets()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  // Tint colors for glass effect
  const containerTint = isDark ? '#27272a' : '#f4f4f5'
  const buttonTint = isDark ? '#ff6900' : '#2563eb'

  const focusProgress = useSharedValue(0)

  const rRootContainerStyle = useAnimatedStyle(() => {
    const paddingBottom = interpolate(
      focusProgress.get(),
      [0, 1],
      [insets.bottom + 12, 12]
    )
    return { paddingBottom }
  })

  const rInputContainerStyle = useAnimatedStyle(() => {
    const height = interpolate(
      focusProgress.get(),
      [0, 1],
      [MIN_INPUT_HEIGHT, MAX_INPUT_HEIGHT]
    )
    return { height }
  })

  const handleSend = () => {
    if (!inputValue.trim()) return
    onSend(inputValue.trim())
    onChangeText?.('')
    if (!isControlled) setValue('')
    textInputRef.current?.blur()

    focusProgress.set(withSpring(0))
  }

  const handleFocus = () => {

    focusProgress.set(withSpring(1))
  }

  const handleBlur = () => {

    focusProgress.set(withSpring(0))
  }

  return (
    <Animated.View style={rRootContainerStyle} className="mx-3 mt-auto">
      <Pressable onPress={() => textInputRef.current?.focus()}>
        <AnimatedGlassView
          style={[
            { borderCurve: 'continuous', borderRadius: MIN_INPUT_HEIGHT / 2 },
            rInputContainerStyle,
          ]}
          isInteractive
        >
        <View className="flex-row items-center">
          <TextInput
            ref={textInputRef}
            value={inputValue}
            onChangeText={(text) => {
              onChangeText?.(text)
              if (!isControlled) setValue(text)
            }}
            placeholder="Message..."
            placeholderTextColor="#71717a"
            selectionColor="#ff6900"
            className="flex-1 px-5 text-foreground text-base"
            style={{
              minHeight: MIN_INPUT_HEIGHT,
              paddingTop: Platform.OS === 'ios' ? 12 : 16,
              paddingBottom: Platform.OS === 'ios' ? 18 : 16,
            }}
            multiline
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...textInputProps}
          />
        </View>

        <View
          className="absolute bottom-0 left-0 right-0 flex-row items-center justify-end px-2"
          style={{ height: MIN_INPUT_HEIGHT }}
        >
          <Pressable onPress={() => { 
            Haptics.selection();
            if (inputValue.trim()) handleSend() 
            }}>
            <GlassView
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                borderCurve: 'continuous',

                alignItems: 'center',
                justifyContent: 'center',
              }}
              tintColor={buttonTint}
              isInteractive
            >
              {inputValue.trim() ? (
                <ArrowUp size={16} color="white" strokeWidth={3} />
              ) : (
                <Mic size={16} color="white" strokeWidth={3} />
              )}
            </GlassView>
          </Pressable>
        </View>
        </AnimatedGlassView>
      </Pressable>
    </Animated.View>
  )
}
