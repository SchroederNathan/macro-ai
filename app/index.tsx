import { useState } from 'react'
import { View, Text, Pressable, Keyboard } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { KeyboardStickyView } from 'react-native-keyboard-controller'
import { MessageBubble, AnimatedInput } from '@/components/chat'
import type { Message } from '@/types/chat'

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', content: 'Hello! How can I help you today?', role: 'assistant', timestamp: new Date() }
  ])
  const insets = useSafeAreaInsets()

  const handleSend = (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content: text,
      role: 'user',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    // TODO: Add AI response logic here
  }

  return (
    <View className={`flex-1 bg-background pt-safe`}>


      {/* Messages - tap to dismiss keyboard */}
      <Pressable className="flex-1" onPress={Keyboard.dismiss}>
        <FlashList
          data={messages}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={{ paddingVertical: 16 }}
        />
      </Pressable>

      {/* Input pinned to keyboard */}
      <KeyboardStickyView>
        <AnimatedInput onSend={handleSend} />
      </KeyboardStickyView>
    </View>
  )
}
