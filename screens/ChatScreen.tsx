import { AnimatedInput, EmptyStateCarousels, MessageBubble, MIN_INPUT_HEIGHT, ThinkingIndicator } from '@/components/chat'
import { colors } from '@/constants/colors'
import { generateAPIUrl } from '@/utils'
import { useChat } from '@ai-sdk/react'
import { useHeaderHeight } from '@react-navigation/elements'
import { FlashList, type FlashListRef } from '@shopify/flash-list'
import type { UIMessage } from 'ai'
import { DefaultChatTransport } from 'ai'
import { fetch as expoFetch } from 'expo/fetch'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Dimensions, Keyboard, Pressable, useColorScheme, View } from 'react-native'
import { Text } from '@/components/ui/Text'
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller'
import type { SharedValue } from 'react-native-reanimated'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'

/** Animated spacer that adjusts height based on keyboard */
function KeyboardSpacer({ keyboardHeight, baseHeight }: { keyboardHeight: SharedValue<number>, baseHeight: number }) {
  const animatedStyle = useAnimatedStyle(() => ({
    height: baseHeight + Math.abs(keyboardHeight.value),
  }))
  return <Animated.View style={animatedStyle} />
}

const SCREEN_WIDTH = Dimensions.get('window').width

export default function ChatScreen() {
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingStartTime, setThinkingStartTime] = useState<number | null>(null)
  const prevMessageCountRef = useRef(0)
  const listRef = useRef<FlashListRef<UIMessage>>(null)
  const headerHeight = useHeaderHeight()
  const insets = useSafeAreaInsets()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  // Keyboard animation for content padding
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation()

  const { messages, error, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      fetch: expoFetch as unknown as typeof globalThis.fetch,
      api: generateAPIUrl('/api/chat'),
    }),
    onError: error => {
      console.error(error, 'ERROR')
      setIsThinking(false)
    },
  })

  // Base bottom padding: input height + safe area + some margin
  const baseBottomPadding = MIN_INPUT_HEIGHT + insets.bottom + 40

  // Scroll to bottom helper
  const scrollToBottom = useCallback((animated = true) => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToEnd({ animated })
    }
  }, [messages.length])


  // Track when assistant responds (message count increases with assistant message)
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'assistant' && messages.length > prevMessageCountRef.current) {
      // Assistant has started responding
      setIsThinking(false)
    }
    prevMessageCountRef.current = messages.length
  }, [messages])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      // Small delay to ensure content is rendered
      requestAnimationFrame(() => {
        scrollToBottom(true)
      })
    }
  }, [messages.length, scrollToBottom])

  const handleSend = () => {
    if (!input.trim()) return
    setIsThinking(true)
    setThinkingStartTime(Date.now())
    sendMessage({ text: input })
    // Scroll to bottom after sending
    requestAnimationFrame(() => {
      scrollToBottom(true)
    })
  }

  const handleCarouselSelect = useCallback((text: string) => {
    setIsThinking(true)
    setThinkingStartTime(Date.now())
    sendMessage({ text })
  }, [sendMessage])

  // Check if we need a standalone thinking indicator (no assistant message yet)
  const lastMessage = messages[messages.length - 1]
  const needsStandaloneThinking = isThinking && (!lastMessage || lastMessage.role === 'user')

  // Footer component with keyboard-aware spacer
  const ListFooter = useMemo(() => (
    <>
      {needsStandaloneThinking && (
        <View className="px-4 py-1">
          <View className="px-4 py-3">
            <ThinkingIndicator isThinking={true} startTime={thinkingStartTime} />
          </View>
        </View>
      )}
      {/* Spacer that grows with keyboard to keep content above it */}
      <KeyboardSpacer keyboardHeight={keyboardHeight} baseHeight={baseBottomPadding} />
    </>
  ), [needsStandaloneThinking, thinkingStartTime, keyboardHeight, baseBottomPadding])

  if (error) return <Text>{error.message}</Text>

  return (
    <View className="flex-1 bg-background">
      {/* Messages list - fills entire screen, content scrolls under input */}
      <Pressable className="absolute inset-0" onPress={Keyboard.dismiss}>
        {messages.length === 0 && (
          <View style={{ paddingTop: headerHeight + 8 }}>
            <EmptyStateCarousels onSelectItem={handleCarouselSelect} />
          </View>
        )}
        <FlashList
          ref={listRef}
          data={messages}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          renderItem={({ item, index }) => (
            <MessageBubble
              message={item}
              isThinking={isThinking && index === messages.length - 1}
              thinkingStartTime={thinkingStartTime}
            />
          )}
          contentContainerStyle={{
            paddingTop: headerHeight + 8,
          }}
          onContentSizeChange={() => {
            // Scroll to bottom when content size changes (streaming)
            if (messages.length > 0) {
              scrollToBottom(false)
            }
          }}
          ListFooterComponent={ListFooter}
        />
      </Pressable>

      {/* Floating input - positioned over content with keyboard animation */}
      <AnimatedInput
        value={input}
        onChangeText={setInput}
        onSend={handleSend}
        hasMessages={messages.length > 0}
        keyboardHeight={keyboardHeight}
      />
      <LinearGradient
        colors={[
          isDark ? colors.dark.background + '00' : colors.light.background + '00',
          isDark ? colors.dark.background : colors.light.background
        ]}

        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, zIndex: 0 }}
      />
      <Svg style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: SCREEN_WIDTH,  zIndex: 10,  height: 100 }}>
        <Defs>
          <RadialGradient id="grad" cx="50%" cy="100%" r="100%">
            <Stop offset="0%" stopColor={isDark ? colors.dark.primary : colors.light.primary} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={isDark ? colors.dark.background : colors.light.background} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
      </Svg>
    </View>
  )
}
