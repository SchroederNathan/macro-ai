import { Text } from '@/components/ui/Text'
import type { UIMessage } from 'ai'
import { useCallback } from 'react'
import { Linking, View } from 'react-native'
import { EnrichedMarkdownText } from 'react-native-enriched-markdown'
import { ThinkingIndicator } from './ThinkingIndicator'
import { useMarkdownStyle } from './useMarkdownStyle'

type MessageBubbleProps = {
  message: UIMessage
  isThinking?: boolean
  thinkingStartTime?: number | null
}

export function MessageBubble({ message, isThinking = false, thinkingStartTime }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const markdownStyle = useMarkdownStyle()

  const handleLinkPress = useCallback((url: string) => {
    Linking.openURL(url)
  }, [])

  return (
    <View className={`flex-row ${isUser ? 'justify-end' : 'justify-start'} px-4 py-2`} id={message.id}>
      <View
        className={`${isUser ? 'max-w-[80%]' : 'max-w-full'}  rounded-3xl ${isUser && 'bg-user-bubble px-4 py-3'}`}
        style={{ borderCurve: 'continuous' }}
      >
        {/* Show thinking indicator as header for assistant messages */}
        {isAssistant && (
          <ThinkingIndicator isThinking={isThinking} startTime={thinkingStartTime} />
        )}

        {message.parts.map((part, i) => {
          switch (part.type) {
            case 'text':
              if (isUser) {
                return <Text className="text-white text-base" key={`${message.id}-${i}`}>{part.text}</Text>
              }
              return (
                <EnrichedMarkdownText
                  key={`${message.id}-${i}`}
                  markdown={part.text}
                  markdownStyle={markdownStyle}
                  onLinkPress={(event) => handleLinkPress(event.url)}
                />
              )
          }
        })}
      </View>
    </View>
  )
}
