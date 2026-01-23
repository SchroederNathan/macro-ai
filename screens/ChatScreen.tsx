import { AnimatedInput, MessageBubble, MIN_INPUT_HEIGHT, ThinkingIndicator } from '@/components/chat'
import { generateAPIUrl } from '@/utils'
import { useChat } from '@ai-sdk/react'
import { FlashList, type FlashListRef } from '@shopify/flash-list'
import type { UIMessage } from 'ai'
import { DefaultChatTransport } from 'ai'
import { fetch as expoFetch } from 'expo/fetch'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Keyboard, Pressable, Text, View } from 'react-native'
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useHeaderHeight } from '@react-navigation/elements'

import type { SharedValue } from 'react-native-reanimated'

/** Animated spacer that adjusts height based on keyboard */
function KeyboardSpacer({ keyboardHeight, baseHeight }: { keyboardHeight: SharedValue<number>, baseHeight: number }) {
  const animatedStyle = useAnimatedStyle(() => ({
    height: baseHeight + Math.abs(keyboardHeight.value),
  }))
  return <Animated.View style={animatedStyle} />
}

export default function ChatScreen() {
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [thinkingStartTime, setThinkingStartTime] = useState<number | null>(null)
  const prevMessageCountRef = useRef(0)
  const listRef = useRef<FlashListRef<UIMessage>>(null)
  const headerHeight = useHeaderHeight()
  const insets = useSafeAreaInsets()

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
    </View>
  )
}
