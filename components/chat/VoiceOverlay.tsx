import { AudioWaveform } from './AudioWaveform'
import { ShimmerText } from './ShimmerText'
import { Text } from '@/components/ui/Text'
import { colors } from '@/constants/colors'
import type { VoiceState } from '@/hooks/useVoiceChat'
import { Mic, X } from 'lucide-react-native'
import { Pressable, useColorScheme, useWindowDimensions, View } from 'react-native'
import { Haptics } from 'react-native-nitro-haptics'
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useEffect } from 'react'

function getProcessingText(
  isThinking: boolean,
  toolName: string | null,
  toolState: string | null,
  foodQuery?: string
): string {
  if (toolState === 'output-available') return 'Finishing up...'
  if (toolName === 'tool-lookup_and_log_food' && foodQuery) return `Looking up ${foodQuery}...`
  if (toolName === 'tool-remove_food_entry' && foodQuery) return `Removing ${foodQuery}...`
  if (toolName === 'tool-update_food_servings' && foodQuery) return `Updating ${foodQuery}...`
  if (toolName) return 'Searching...'
  if (isThinking) return 'Thinking...'
  return 'Processing...'
}

type VoiceOverlayProps = {
  state: VoiceState
  interimTranscript: string
  lastAssistantText: string
  analyserNode: any | null
  toolName: string | null
  toolState: string | null
  foodQuery?: string
  isThinking: boolean
  onClose: () => void
  onTapInterrupt: () => void
}

function PulsingMic({ color }: { color: string }) {
  const scale = useSharedValue(1)

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
  }, [scale])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 0.3,
  }))

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: color,
          },
          animatedStyle,
        ]}
      />
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Mic size={32} color="white" strokeWidth={2} />
      </View>
    </View>
  )
}

export function VoiceOverlay({
  state,
  interimTranscript,
  lastAssistantText,
  analyserNode,
  toolName,
  toolState,
  foodQuery,
  isThinking,
  onClose,
  onTapInterrupt,
}: VoiceOverlayProps) {
  const insets = useSafeAreaInsets()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const { width: screenWidth } = useWindowDimensions()

  const primaryColor = isDark ? colors.dark.primary : colors.light.primary
  const bgColor = isDark ? 'rgba(10,10,10,0.95)' : 'rgba(250,250,250,0.95)'
  const textColor = isDark ? colors.dark.foreground : colors.light.foreground
  const mutedColor = isDark ? '#a3a3a3' : '#71717a'

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: bgColor,
        zIndex: 50,
      }}
    >
      <Pressable
        style={{ flex: 1 }}
        onPress={() => {
          if (state === 'speaking') {
            Haptics.impact('light')
            onTapInterrupt()
          }
        }}
      >
        {/* Close button */}
        <Pressable
          onPress={() => {
            Haptics.selection()
            onClose()
          }}
          style={{
            position: 'absolute',
            top: insets.top + 12,
            right: 20,
            zIndex: 10,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isDark ? '#27272a' : '#e4e4e7',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={20} color={textColor} strokeWidth={2.5} />
        </Pressable>

        {/* Center content */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          {state === 'listening' && (
            <Animated.View entering={FadeIn.duration(300)} style={{ alignItems: 'center' }}>
              <PulsingMic color={primaryColor} />
              <View style={{ marginTop: 32, minHeight: 48 }}>
                {interimTranscript ? (
                  <Text
                    style={{
                      fontSize: 20,
                      color: textColor,
                      textAlign: 'center',
                      fontFamily: 'Sentient Variable',
                    }}
                  >
                    {interimTranscript}
                  </Text>
                ) : (
                  <Text
                    style={{
                      fontSize: 17,
                      color: mutedColor,
                      textAlign: 'center',
                      fontFamily: 'Sentient Variable',
                    }}
                  >
                    Listening...
                  </Text>
                )}
              </View>
            </Animated.View>
          )}

          {state === 'processing' && (
            <Animated.View entering={FadeIn.duration(300)} style={{ alignItems: 'center' }}>
              <ShimmerText
                className="text-xl"
                highlightColor={primaryColor}
              >
                {getProcessingText(isThinking, toolName, toolState, foodQuery)}
              </ShimmerText>
            </Animated.View>
          )}

          {state === 'speaking' && (
            <Animated.View entering={FadeIn.duration(300)} style={{ alignItems: 'center' }}>
              <AudioWaveform
                analyserNode={analyserNode}
                isActive={state === 'speaking'}
                color={primaryColor}
                width={screenWidth - 64}
                height={80}
              />
              {lastAssistantText ? (
                <Text
                  style={{
                    marginTop: 24,
                    fontSize: 17,
                    color: textColor,
                    textAlign: 'center',
                    fontFamily: 'Sentient Variable',
                    lineHeight: 24,
                  }}
                  numberOfLines={4}
                >
                  {lastAssistantText}
                </Text>
              ) : null}
              <Text
                style={{
                  marginTop: 16,
                  fontSize: 13,
                  color: mutedColor,
                  textAlign: 'center',
                }}
              >
                Tap to interrupt
              </Text>
            </Animated.View>
          )}
        </View>

        {/* State label at bottom */}
        <View style={{ paddingBottom: insets.bottom + 24, alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 13,
              color: mutedColor,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {state === 'listening' ? 'Voice Mode' : state === 'processing' ? 'Processing' : 'Speaking'}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  )
}
