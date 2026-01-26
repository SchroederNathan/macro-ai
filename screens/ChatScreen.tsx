import { AnimatedInput, EmptyStateCarousels, MessageBubble, MIN_INPUT_HEIGHT, ToolActivityIndicator } from '@/components/chat'
import { colors } from '@/constants/colors'
import { generateAPIUrl } from '@/utils'
import { useDailyLogStore, useUserStore } from '@/stores'
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

type ToolActivity = {
  toolName: string | null
  toolState: string | null
  foodQuery: string | null
}

export default function ChatScreen() {
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [toolActivity, setToolActivity] = useState<ToolActivity>({
    toolName: null,
    toolState: null,
    foodQuery: null,
  })
  const prevMessageCountRef = useRef(0)
  const processedToolCallsRef = useRef<Set<string>>(new Set())
  const listRef = useRef<FlashListRef<UIMessage>>(null)
  const headerHeight = useHeaderHeight()
  const insets = useSafeAreaInsets()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  // Keyboard animation for content padding
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation()

  // Zustand stores
  const dailyLogStore = useDailyLogStore()
  const userStore = useUserStore()

  // Load stores on mount
  useEffect(() => {
    dailyLogStore.load()
    userStore.load()
  }, [])

  const { messages, error, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      fetch: expoFetch as unknown as typeof globalThis.fetch,
      api: generateAPIUrl('/api/chat'),
    }),
    onError: error => {
      console.error(error, 'ERROR')
      setIsThinking(false)
      setToolActivity({ toolName: null, toolState: null, foodQuery: null })
    },
    onFinish: () => {
      setIsThinking(false)
      // Clear tool activity after a short delay to show completion state
      setTimeout(() => {
        setToolActivity({ toolName: null, toolState: null, foodQuery: null })
      }, 1500)
    },
  })

  // Watch messages for tool activity and results
  useEffect(() => {
    // Only look at the LAST assistant message for current tool state
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant')
    if (!lastAssistantMessage?.parts) {
      return
    }

    // Find the latest tool part in the last assistant message
    let latestToolPart: any = null
    for (const part of lastAssistantMessage.parts) {
      if (part.type.startsWith('tool-')) {
        latestToolPart = part
      }
    }

    // Update tool activity state based on latest tool
    if (latestToolPart) {
      const partAny = latestToolPart as any
      const foodQuery = partAny.input?.foodQuery || null
      const newState = partAny.state

      setToolActivity({
        toolName: latestToolPart.type,
        toolState: newState,
        foodQuery,
      })

      // Keep isThinking true while tool is in progress
      if (newState !== 'output-available') {
        setIsThinking(true)
      }
    }

    // Process tool results for logging (check all messages to avoid missing any)
    for (const message of messages) {
      if (message.role !== 'assistant' || !message.parts) continue

      for (const part of message.parts) {
        if (part.type !== 'tool-lookup_and_log_food') continue

        const partAny = part as any
        const toolCallId = partAny.toolCallId
        if (!toolCallId) continue

        // Skip if already processed
        if (processedToolCallsRef.current.has(toolCallId)) continue

        // Check if this is a completed call with output
        if (partAny.state === 'output-available' && partAny.output) {
          const result = partAny.output as {
            success?: boolean
            entry?: {
              name: string
              quantity: number
              serving: { amount: number; unit: string; gramWeight: number }
              nutrients: { calories: number; protein: number; carbs: number; fat: number; fiber?: number; sugar?: number }
              meal?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
              fdcId?: number
            }
          }

          if (result.success && result.entry) {
            // Mark as processed FIRST to prevent duplicates
            processedToolCallsRef.current.add(toolCallId)

            // Add entry to daily log store
            const entry = dailyLogStore.addEntry({
              quantity: result.entry.quantity,
              snapshot: {
                name: result.entry.name,
                serving: result.entry.serving,
                nutrients: result.entry.nutrients,
                fdcId: result.entry.fdcId,
              },
              meal: result.entry.meal,
            })

            console.log('Food logged:', entry.snapshot.name, entry.snapshot.nutrients.calories, 'cal')
          }
        }
      }
    }
  }, [messages])

  // Base bottom padding: input height + safe area + some margin
  const baseBottomPadding = MIN_INPUT_HEIGHT + insets.bottom + 40

  // Scroll to bottom helper
  const scrollToBottom = useCallback((animated = true) => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToEnd({ animated })
    }
  }, [messages.length])


  // Track when assistant responds with actual TEXT content (not just tool activity)
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'assistant' && lastMessage.parts) {
      // Check if there's any text content in the message
      const hasTextContent = lastMessage.parts.some(
        (part: any) => part.type === 'text' && part.text?.trim()
      )
      if (hasTextContent) {
        setIsThinking(false)
        setToolActivity({ toolName: null, toolState: null, foodQuery: null })
      }
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
    setToolActivity({ toolName: null, toolState: null, foodQuery: null })
    sendMessage({ text: input })
    // Scroll to bottom after sending
    requestAnimationFrame(() => {
      scrollToBottom(true)
    })
  }

  const handleCarouselSelect = useCallback((text: string) => {
    setIsThinking(true)
    setToolActivity({ toolName: null, toolState: null, foodQuery: null })
    sendMessage({ text })
  }, [sendMessage])

  // Show activity indicator while thinking or tool is active
  const showActivityIndicator = isThinking || (toolActivity.toolName && toolActivity.toolState !== 'output-available')

  // Footer component with keyboard-aware spacer
  const ListFooter = useMemo(() => (
    <>
      {showActivityIndicator && (
        <View className="px-4 py-1">
          <View className="px-4 py-3">
            <ToolActivityIndicator
              isThinking={isThinking}
              toolName={toolActivity.toolName}
              toolState={toolActivity.toolState}
              foodQuery={toolActivity.foodQuery || undefined}
            />
          </View>
        </View>
      )}
      {/* Spacer that grows with keyboard to keep content above it */}
      <KeyboardSpacer keyboardHeight={keyboardHeight} baseHeight={baseBottomPadding} />
    </>
  ), [showActivityIndicator, toolActivity, keyboardHeight, baseBottomPadding, isThinking])

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
              isThinking={false}
              thinkingStartTime={null}
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
