import { useEffect, useState } from 'react'
import { Text, useColorScheme, View } from 'react-native'
import { ShimmerText } from './ShimmerText'

type ThinkingIndicatorProps = {
  isThinking: boolean
  startTime?: number | null
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} second${Math.round(seconds) !== 1 ? 's' : ''}`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  if (remainingSeconds === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }
  return `${minutes}m ${remainingSeconds}s`
}

export function ThinkingIndicator({ isThinking, startTime }: ThinkingIndicatorProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const [thinkingDuration, setThinkingDuration] = useState<number | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)

  useEffect(() => {
    if (isThinking) {
      setThinkingDuration(null)
      setShowCompleted(false)
    } else if (startTime) {
      // Finished thinking - calculate duration from passed startTime
      const duration = (Date.now() - startTime) / 1000
      setThinkingDuration(duration)
      setShowCompleted(true)
    }
  }, [isThinking, startTime])

  if (!isThinking && !showCompleted) {
    return null
  }

  return (
    <View className="py-1">
      <View className="py-3 flex-row items-center">
        {isThinking ? (
          <ShimmerText
            className="text-base text-muted"
            highlightColor={isDark ? '#fafafa' : '#0a0a0a'}
          >
            Thinking...
          </ShimmerText>
        ) : (
          <Text className="text-base text-muted">
            Thought for {formatDuration(thinkingDuration ?? 0)}
          </Text>
        )}
      </View>
    </View>
  )
}
