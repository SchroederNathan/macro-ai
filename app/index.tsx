import { AnimatedInput, MessageBubble, MIN_INPUT_HEIGHT, ThinkingIndicator } from '@/components/chat'
import { generateAPIUrl } from '@/utils'
import { useChat } from '@ai-sdk/react'
import { FlashList } from '@shopify/flash-list'
import { DefaultChatTransport } from 'ai'
import { fetch as expoFetch } from 'expo/fetch'
import { useEffect, useRef, useState } from 'react'
import { Keyboard, Pressable, Text, View } from 'react-native'
import { KeyboardStickyView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function ChatScreen() {

  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const prevMessageCountRef = useRef(0)

  const { messages, error, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      fetch: expoFetch as unknown as typeof globalThis.fetch,
      api: generateAPIUrl('/api/chat'),
    }),
  onError: error => {
      console.error(error, 'ERROR')
      setIsThinking(false)
    },
  });

  const insets = useSafeAreaInsets()


  // Track when assistant responds (message count increases with assistant message)
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'assistant' && messages.length > prevMessageCountRef.current) {
      // Assistant has started responding
      setIsThinking(false)
    }
    prevMessageCountRef.current = messages.length
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    setIsThinking(true)
    sendMessage({ text: input })
  }

  if (error) return <Text>{error.message}</Text>;


  // Check if we need a standalone thinking indicator (no assistant message yet)
  const lastMessage = messages[messages.length - 1]
  const needsStandaloneThinking = isThinking && (!lastMessage || lastMessage.role === 'user')

  return (
    <View className="flex-1 bg-background pt-safe">
      {/* Messages - tap to dismiss keyboard */}
      <Pressable className="flex-1" onPress={Keyboard.dismiss}>
        <FlashList
          data={messages}
          renderItem={({ item, index }) => (
            <MessageBubble
              message={item}
              isThinking={isThinking && index === messages.length - 1}
            />
          )}
          className="flex-1"
          contentContainerClassName="py-4"
          contentContainerStyle={{
            paddingBottom: MIN_INPUT_HEIGHT + insets.bottom + 12,
          }}
          ListFooterComponent={
            needsStandaloneThinking ? (
              <View className="px-4 py-1">
                <View className="px-4 py-3">
                  <ThinkingIndicator isThinking={true} />
                </View>
              </View>
            ) : null
          }
        />
      </Pressable>

      {/* Input pinned to keyboard */}
      <KeyboardStickyView>
        <AnimatedInput value={input} onChangeText={setInput} onSend={handleSend} />
      </KeyboardStickyView>
    </View>
  )
}
