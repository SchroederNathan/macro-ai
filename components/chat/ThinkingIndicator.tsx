import { useEffect, useRef, useState } from 'react'
import { Text, useColorScheme, View } from 'react-native'
import { ShimmerText } from './ShimmerText'

type ThinkingIndicatorProps = {
  isThinking: boolean
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

export function ThinkingIndicator({ isThinking }: ThinkingIndicatorProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const startTimeRef = useRef<number | null>(null)
  const [thinkingDuration, setThinkingDuration] = useState<number | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)

  useEffect(() => {
    if (isThinking) {
      // Start thinking
      startTimeRef.current = Date.now()
      setThinkingDuration(null)
      setShowCompleted(false)
    } else if (startTimeRef.current !== null) {
      // Finished thinking
      const duration = (Date.now() - startTimeRef.current) / 1000
      setThinkingDuration(duration)
      setShowCompleted(true)
      startTimeRef.current = null
    }
  }, [isThinking])

  if (!isThinking && !showCompleted) {
    return null
  }

  return (
    <View className="py-1">
      <View className="py-3 flex-row items-center">
        {isThinking ? (
          <ShimmerText
            className="text-base text-muted-foreground"
            highlightColor={isDark ? '#fafafa' : '#0a0a0a'}
          >
            Thinking...
          </ShimmerText>
        ) : (
          <Text className="text-base text-muted-foreground">
            Thought for {formatDuration(thinkingDuration ?? 0)}
          </Text>
        )}
      </View>
    </View>
  )
}
