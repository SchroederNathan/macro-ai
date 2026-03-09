import { Text } from '@/components/ui/Text'
import { ChevronDown } from 'lucide-react-native'
import { FC, useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, useColorScheme, View } from 'react-native'
import Animated, {
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated'
import { ShimmerText } from './ShimmerText'

type ThinkingDropdownProps = {
  isThinking: boolean
  thinkingStartTime: number | null
  toolName: string | null
  toolState: string | null
  foodQuery?: string
}

type StepInfo = { label: string; detail: string }

function getStepInfo(
  toolName: string | null,
  toolState: string | null,
  foodQuery?: string
): StepInfo | null {
  if (toolState === 'output-available') return null

  const q = foodQuery ? foodQuery.charAt(0).toLowerCase() + foodQuery.slice(1) : null

  if (toolName === 'tool-lookup_and_log_food') {
    if (!q) return null
    return { label: 'Searching', detail: `${q}` }
  }
  if (toolName === 'tool-remove_food_entry') {
    if (!q) return null
    return { label: 'Removing', detail: `${q}` }
  }
  if (toolName === 'tool-update_food_servings') {
    if (!q) return null
    return { label: 'Updating', detail: `${q}` }
  }
  if (toolName === 'tool-ask_user') {
    if (!q) return null
    return { label: 'Asking user', detail: q }
  }
  return null
}

/** Unique key for deduplication */
function stepKey(step: StepInfo): string {
  return `${step.label}:${step.detail}`
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    const s = Math.round(seconds)
    return `${s} second${s !== 1 ? 's' : ''}`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  if (remainingSeconds === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }
  return `${minutes}m ${remainingSeconds}s`
}

/** Single step that animates down into place on mount */
const StepItem: FC<{
  label: string
  detail: string
  index: number
  isFirst: boolean
  isLast: boolean
}> = ({ label, detail, index, isFirst, isLast }) => {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.set(withDelay(index * 50, withSpring(1)))
    return () => cancelAnimation(progress)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: interpolate(progress.get(), [0, 1], [-12, 0]) }],
  }))

  const isSingle = isFirst && isLast

  return (
    <Animated.View style={animatedStyle} className="flex-row items-stretch ">
      <View className="items-center w-0">
        <View
          className={`w-[1.5] flex-1 ${isFirst ? 'bg-transparent' : 'bg-muted/20'}`}
        />
        <View className="w-[5] h-[5] rounded-full bg-muted/20" />
        <View
          className={`w-[1.5] flex-1 ${isLast ? 'bg-transparent' : 'bg-muted/20'}`}
        />
      </View>
      <Text className={`text-sm flex-1 ml-4 ${isSingle ? '' : 'py-1'}`}>
        <Text className="text-muted">{label} </Text>
        <Text className="text-muted/50">{detail}</Text>
      </Text>
    </Animated.View>
  )
}

export function ThinkingDropdown({
  isThinking,
  thinkingStartTime,
  toolName,
  toolState,
  foodQuery,
}: ThinkingDropdownProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const [steps, setSteps] = useState<StepInfo[]>([])
  const [duration, setDuration] = useState<number | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const [revealKey, setRevealKey] = useState(0)
  const lastStepKeyRef = useRef<string | null>(null)
  const wasThinkingRef = useRef(false)

  const chevronRotation = useSharedValue(0)

  // Accumulate steps — only add, never clear mid-thinking
  useEffect(() => {
    if (!isThinking) return
    const info = getStepInfo(toolName, toolState, foodQuery)
    if (info) {
      const key = stepKey(info)
      if (key !== lastStepKeyRef.current) {
        lastStepKeyRef.current = key
        setSteps(prev => [...prev, info])
      }
    }
  }, [isThinking, toolName, toolState, foodQuery])

  // Handle thinking transitions
  useEffect(() => {
    if (isThinking && !wasThinkingRef.current) {
      setSteps([])
      setDuration(null)
      setIsExpanded(true)
      lastStepKeyRef.current = null
      cancelAnimation(chevronRotation)
      chevronRotation.set(1)
    } else if (!isThinking && wasThinkingRef.current) {
      if (thinkingStartTime) {
        setDuration((Date.now() - thinkingStartTime) / 1000)
      }
      setIsExpanded(false)
      cancelAnimation(chevronRotation)
      chevronRotation.set(withSpring(0))
    }
    wasThinkingRef.current = isThinking
  }, [isThinking, thinkingStartTime, chevronRotation])

  const toggle = useCallback(() => {
    if (isThinking) return
    const next = !isExpanded
    setIsExpanded(next)
    if (next) {
      setRevealKey(k => k + 1)
    }
    cancelAnimation(chevronRotation)
    chevronRotation.set(withSpring(next ? 1 : 0))
  }, [isThinking, isExpanded, chevronRotation])

  // 0 = collapsed (pointing right, -90°), 1 = expanded (pointing down, 0°)
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-90 + chevronRotation.get() * 90}deg` }],
  }))

  // Don't render if never started thinking
  if (!isThinking && duration === null) return null

  const mutedColor = isDark ? '#a3a3a3' : '#f4f4f5'
  const showChevron = !isThinking && steps.length > 0
  const showSteps = steps.length > 0 && (isExpanded || isThinking)

  return (
    <View className="py-1">
      {/* Header row */}
      <Pressable
        onPress={toggle}
        className="flex-row items-center gap-1 "
        hitSlop={12}
        disabled={isThinking}
      >
        {isThinking ? (
          <ShimmerText
            className="text-base text-muted"
            highlightColor={isDark ? '#fafafa' : '#0a0a0a'}
          >
            Thinking
          </ShimmerText>
        ) : (
          <Text className="text-base text-muted">
            Thought{" "}
            <Text className="text-muted/50">
              for {formatDuration(duration ?? 0)}
            </Text>
          </Text>
        )}
        {showChevron && (
          <Animated.View style={chevronStyle}>
            <ChevronDown size={16} color={mutedColor} />
          </Animated.View>
        )}
      </Pressable>

      {/* Steps — simple conditional render, layout animations on parent handle shifting */}
      {showSteps && (
        <View className="pl-1 pt-0.5" key={revealKey}>
          {steps.map((step, i) => (
            <StepItem
              key={`${revealKey}-${i}-${stepKey(step)}`}
              label={step.label}
              detail={step.detail}
              index={i}
              isFirst={i === 0}
              isLast={i === steps.length - 1}
            />
          ))}
        </View>
      )}
    </View>
  )
}
