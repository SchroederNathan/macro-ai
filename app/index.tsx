import { AnimatedInput, MessageBubble, MIN_INPUT_HEIGHT } from '@/components/chat'
import { generateAPIUrl } from '@/utils'
import { useChat } from '@ai-sdk/react'
import { FlashList } from '@shopify/flash-list'
import { DefaultChatTransport } from 'ai'
import { fetch as expoFetch } from 'expo/fetch'
import { useState } from 'react'
import { Keyboard, Pressable, Text, View } from 'react-native'
import { KeyboardStickyView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function ChatScreen() {

  const [input, setInput] = useState('')


  const { messages, error, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      fetch: expoFetch as unknown as typeof globalThis.fetch,
      api: generateAPIUrl('/api/chat'),
    }),
    onError: error => console.error(error, 'ERROR'),
  });

  if (error) return <Text>{error.message}</Text>;

  const insets = useSafeAreaInsets()
  
  return (
    <View className="flex-1 bg-background pt-safe">
      {/* Messages - tap to dismiss keyboard */}
      <Pressable className="flex-1" onPress={Keyboard.dismiss}>
        <FlashList
          data={messages}
          renderItem={({ item }) => <MessageBubble message={item} />}
          className="flex-1"
          contentContainerClassName="py-4"
          contentContainerStyle={{
            paddingBottom: MIN_INPUT_HEIGHT + insets.bottom + 12,
          }}
        />
      </Pressable>

      {/* Input pinned to keyboard */}
      <KeyboardStickyView>
        <AnimatedInput value={input} onChangeText={setInput} onSend={() => sendMessage({ text: input })} />
      </KeyboardStickyView>
    </View>
  )
}
