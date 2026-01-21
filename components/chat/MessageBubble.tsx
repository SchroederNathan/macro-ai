import type { Message } from '@/types/chat'
import { Text, View } from 'react-native'

type MessageBubbleProps = {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <View className={`flex-row ${isUser ? 'justify-end' : 'justify-start'} px-4 py-1`}>
      <View
        className={`max-w-[80%] px-4 py-3 rounded-3xl ${isUser && 'bg-user-bubble'
          }`}
        style={{ borderCurve: 'continuous' }}
      >
        <Text className={isUser ? 'text-white' : 'text-foreground'}>
          {message.content}
        </Text>
      </View>
    </View>
  )
}
