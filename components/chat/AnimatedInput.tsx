import { useRef, useState } from 'react'
import { Keyboard, Platform, Pressable, TextInput, View } from 'react-native'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ArrowUp, Mic } from 'lucide-react-native'

const MIN_INPUT_HEIGHT = 56
const MAX_INPUT_HEIGHT = 112

type AnimatedInputProps = {
  onSend: (text: string) => void
}

export function AnimatedInput({ onSend }: AnimatedInputProps) {
  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const textInputRef = useRef<TextInput>(null)
  const insets = useSafeAreaInsets()

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
    if (!value.trim()) return
    onSend(value.trim())
    setValue('')
    textInputRef.current?.blur()
    setIsFocused(false)
    focusProgress.set(withSpring(0))
  }

  const handleFocus = () => {
    setIsFocused(true)
    focusProgress.set(withSpring(1))
  }

  const handleBlur = () => {
    setIsFocused(false)
    focusProgress.set(withSpring(0))
  }

  return (
    <Animated.View style={rRootContainerStyle} className="mx-3 mt-auto">
      <Animated.View
        style={[
          { borderCurve: 'continuous', borderRadius: MIN_INPUT_HEIGHT / 2 },
          rInputContainerStyle,
        ]}
        className="bg-chat border border-border"
      >
        <View className="flex-row items-center">
          <TextInput
            ref={textInputRef}
            value={value}
            onChangeText={setValue}
            placeholder="Message..."
            placeholderTextColor="#71717a"
            selectionColor="#3b82f6"
            className="flex-1 px-5 text-foreground text-base"
            style={{
              minHeight: MIN_INPUT_HEIGHT,
              paddingTop: Platform.OS === 'ios' ? 12 : 16,
              paddingBottom: Platform.OS === 'ios' ? 18 : 16,
            }}
            multiline
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </View>

        <View
          className="absolute bottom-0 left-0 right-0 flex-row items-center justify-end px-2"
          style={{ height: MIN_INPUT_HEIGHT }}
        >
          <Pressable
            onPress={value.trim() ? handleSend : undefined}
            className={`w-10 h-10 rounded-full items-center justify-center bg-primary ring-1 ring-primary-border`}
            style={{ borderCurve: 'continuous' }}
          >
            {value.trim() ? (
              <ArrowUp size={16} color="white" strokeWidth={3} />
            ) : (
              <Mic size={16} color="white" strokeWidth={3} />
            )}
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  )
}
