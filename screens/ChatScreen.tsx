import { AnimatedInput, type AnimatedInputRef, EmptyStateCarousels, FoodConfirmationCard, type FoodConfirmationEntry, MessageBubble, MIN_INPUT_HEIGHT, ToolActivityIndicator } from '@/components/chat'
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
import { Haptics } from 'react-native-nitro-haptics'
import { Dimensions, Keyboard, Pressable, useColorScheme, View } from 'react-native'
import { Text } from '@/components/ui/Text'
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller'
import type { SharedValue } from 'react-native-reanimated'
import Animated, { SlideInUp, useAnimatedStyle } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'

/** Generate a creative meal title from food names */
async function generateMealTitle(foodNames: string[]): Promise<string | null> {
  try {
    const url = generateAPIUrl('/api/meal-title')
    console.log('[MEAL TITLE] Fetching:', url)

    const response = await expoFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foodNames }),
    })

    // Check if response is ok before parsing
    if (!response.ok) {
      console.error('[MEAL TITLE] Response not ok:', response.status, response.statusText)
      return null
    }

    const text = await response.text()
    console.log('[MEAL TITLE] Raw response:', text)

    try {
      const data = JSON.parse(text)
      return data.title || null
    } catch {
      console.error('[MEAL TITLE] Failed to parse JSON:', text)
      return null
    }
  } catch (error) {
    console.error('[MEAL TITLE] Error generating title:', error)
    return null
  }
}

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
  const [pendingEntries, setPendingEntries] = useState<{
    toolCallId: string
    entry: FoodConfirmationEntry
  }[]>([])
  const [showCard, setShowCard] = useState(false)
  const [mealTitle, setMealTitle] = useState<string | null>(null)
  const [isTitleLoading, setIsTitleLoading] = useState(false)
  const prevMessageCountRef = useRef(0)
  const processedToolCallsRef = useRef<Set<string>>(new Set())
  const listRef = useRef<FlashListRef<UIMessage>>(null)
  const inputRef = useRef<AnimatedInputRef>(null)
  const headerHeight = useHeaderHeight()
  const insets = useSafeAreaInsets()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  // Keyboard animation for content padding
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation()

  // Zustand stores - destructure functions for stable references
  const { load: loadDailyLog, addEntry } = useDailyLogStore()
  const { load: loadUserStore } = useUserStore()

  // Load stores on mount
  useEffect(() => {
    loadDailyLog()
    loadUserStore()
  }, [loadDailyLog, loadUserStore])

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
    // Find the last user message index
    const lastUserMessageIndex = messages.findLastIndex(m => m.role === 'user')

    // Only look at assistant messages AFTER the last user message
    const assistantMessagesAfterUser = messages.slice(lastUserMessageIndex + 1).filter(m => m.role === 'assistant')
    const lastAssistantMessage = assistantMessagesAfterUser[assistantMessagesAfterUser.length - 1]

    if (!lastAssistantMessage?.parts) {
      // No assistant message after last user message - clear tool activity
      if (lastUserMessageIndex === messages.length - 1) {
        // User just sent a message, waiting for response
        setToolActivity({ toolName: null, toolState: null, foodQuery: null })
      }
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
    } else {
      // Assistant message has no tool parts - clear tool activity
      setToolActivity({ toolName: null, toolState: null, foodQuery: null })
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
            estimated?: boolean
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
            // Mark as processed to prevent duplicates
            processedToolCallsRef.current.add(toolCallId)

            // Show card and append to pending entries for user confirmation
            setShowCard(true)
            setPendingEntries(prev => [...prev, {
              toolCallId,
              entry: {
                name: result.entry.name,
                quantity: result.entry.quantity,
                serving: result.entry.serving,
                nutrients: result.entry.nutrients,
                meal: result.entry.meal,
                fdcId: result.entry.fdcId,
                estimated: result.estimated,
              },
            }])

            console.log('Food ready for confirmation:', result.entry.name, result.entry.nutrients.calories, 'cal')
          }
        }
      }
    }
  }, [messages])

  // Base bottom padding: input height + safe area + some margin
  const cardVisible = showCard || pendingEntries.length > 0
  const baseBottomPadding = MIN_INPUT_HEIGHT + insets.bottom + 40

  // Scroll to bottom helper - no deps on messages.length for stable reference
  const scrollToBottom = useCallback((animated = true) => {
    listRef.current?.scrollToEnd({ animated })
  }, [])


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

  const handleSend = useCallback(() => {
    if (!input.trim()) return
    setIsThinking(true)
    setToolActivity({ toolName: null, toolState: null, foodQuery: null })
    sendMessage({ text: input })
    // Scroll to bottom after sending
    requestAnimationFrame(() => {
      scrollToBottom(true)
    })
  }, [input, sendMessage, scrollToBottom])

  const handleCarouselSelect = useCallback((text: string) => {
    setIsThinking(true)
    setToolActivity({ toolName: null, toolState: null, foodQuery: null })
    sendMessage({ text })
  }, [sendMessage])

  // Helper to get default meal based on time of day
  const getDefaultMeal = (): 'breakfast' | 'lunch' | 'dinner' | 'snack' => {
    const hour = new Date().getHours()
    if (hour < 10) return 'breakfast'
    if (hour < 14) return 'lunch'
    if (hour < 20) return 'dinner'
    return 'snack'
  }

  // Handle confirming and logging all pending food entries
  const handleConfirmLog = useCallback(() => {
    if (pendingEntries.length === 0) return

    // Add all entries to daily log store
    for (const pending of pendingEntries) {
      const entry = addEntry({
        quantity: pending.entry.quantity,
        snapshot: {
          name: pending.entry.name,
          serving: pending.entry.serving,
          nutrients: pending.entry.nutrients,
          fdcId: pending.entry.fdcId,
          estimated: pending.entry.estimated,
        },
        meal: pending.entry.meal || getDefaultMeal(),
      })
      console.log('Food logged:', entry.snapshot.name, entry.snapshot.nutrients.calories, 'cal')
    }

    setPendingEntries([])
    setShowCard(false)
    setMealTitle(null)
    setIsTitleLoading(false)
  }, [pendingEntries, addEntry])

  // Handle removing a specific entry from the pending list
  const handleRemoveEntry = useCallback((index: number) => {
    Haptics.selection()
    setPendingEntries(prev => prev.filter((_, i) => i !== index))
  }, [])

  // Handle quantity changes from edit mode
  const handleQuantityChange = useCallback((index: number, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveEntry(index)
    } else {
      setPendingEntries(prev => prev.map((p, i) =>
        i === index ? { ...p, entry: { ...p.entry, quantity: newQuantity } } : p
      ))
    }
  }, [handleRemoveEntry])

  // Generate meal title when entries change (2+ items)
  useEffect(() => {
    if (pendingEntries.length >= 2) {
      setIsTitleLoading(true)
      generateMealTitle(pendingEntries.map(e => e.entry.name))
        .then(title => {
          setMealTitle(title)
          setIsTitleLoading(false)
        })
    } else {
      setMealTitle(null)
      setIsTitleLoading(false)
    }
  }, [pendingEntries])

  // Show activity indicator while thinking or tool is active
  const showActivityIndicator = isThinking || (toolActivity.toolName && toolActivity.toolState !== 'output-available')

  // Footer component with keyboard-aware spacer
  const ListFooter = useMemo(() => (
    <>
      {/* Tool activity indicator - inline with messages */}
      {showActivityIndicator && (
        <View className="px-4 py-2">
          <ToolActivityIndicator
            isThinking={isThinking}
            toolName={toolActivity.toolName}
            toolState={toolActivity.toolState}
            foodQuery={toolActivity.foodQuery || undefined}
          />
        </View>
      )}

      {/* Food confirmation card - now part of scroll content */}
      {cardVisible && (
        <View className="py-4">
          <FoodConfirmationCard
            entries={pendingEntries.map(p => p.entry)}
            mealTitle={mealTitle}
            isTitleLoading={isTitleLoading}
            onConfirm={handleConfirmLog}
            onRemove={handleRemoveEntry}
            onQuantityChange={handleQuantityChange}
          />
        </View>
      )}

      {/* Spacer that grows with keyboard to keep content above it */}
      <KeyboardSpacer keyboardHeight={keyboardHeight} baseHeight={baseBottomPadding} />
    </>
  ), [showActivityIndicator, toolActivity, keyboardHeight, baseBottomPadding, isThinking, cardVisible, pendingEntries, mealTitle, isTitleLoading, handleConfirmLog, handleRemoveEntry, handleQuantityChange])

  // Scroll to bottom when card becomes visible
  useEffect(() => {
    if (cardVisible) {
      requestAnimationFrame(() => {
        scrollToBottom(false)
        setTimeout(() => {
          scrollToBottom(false)
        }, 16)
      })
    }
  }, [cardVisible, scrollToBottom])

  if (error) return <Text>{error.message}</Text>

  return (
    <View className="flex-1 bg-background">
      {/* Messages list - fills entire screen, content scrolls under input */}
      <Pressable className="absolute inset-0" onPress={Keyboard.dismiss}>
        {messages.length === 0 && (
          <Animated.View
            entering={SlideInUp.springify().delay(100)}
            style={{ paddingTop: headerHeight || (insets.top + 44) + 8 }}
          >
            <EmptyStateCarousels onSelectItem={handleCarouselSelect} />
          </Animated.View>
        )}
        <FlashList
          ref={listRef}
          data={messages}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <MessageBubble message={item} />
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
        ref={inputRef}
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
