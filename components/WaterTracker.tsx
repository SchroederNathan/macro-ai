import { colors } from '@/constants/colors'
import { useWaterStore, ML_PER_CUP, formatWaterAmount } from '@/stores/waterStore'
import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Modal,
  Pressable,
  TextInput,
  useColorScheme,
  View,
  Animated,
} from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { Text } from '@/components/ui/Text'
import type { WaterUnit } from '@/lib/storage'

// ─── Constants ───────────────────────────────────────────────────────────────

const RING_SIZE = 120
const STROKE_WIDTH = 8
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const ARC_PERCENTAGE = 0.75
const ARC_LENGTH = CIRCUMFERENCE * ARC_PERCENTAGE
const GAP_LENGTH = CIRCUMFERENCE - ARC_LENGTH

const UNITS: WaterUnit[] = ['ml', 'oz', 'cups']
const UNIT_LABELS: Record<WaterUnit, string> = { ml: 'ml', oz: 'oz', cups: 'cups' }

// ─── CelebrationEmoji ─────────────────────────────────────────────────────────

function CelebrationEmoji({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.4)).current
  const translateY = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      opacity.setValue(1)
      scale.setValue(0.4)
      translateY.setValue(0)

      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1.3,
          useNativeDriver: true,
          tension: 180,
          friction: 6,
        }),
        Animated.timing(translateY, {
          toValue: -40,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(600),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        onDismiss()
      })
    }
  }, [visible])

  if (!visible) return null

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: '30%',
        alignSelf: 'center',
        opacity,
        transform: [{ scale }, { translateY }],
        zIndex: 20,
        pointerEvents: 'none',
      }}
    >
      <Text style={{ fontSize: 48 }}>💧🎉</Text>
    </Animated.View>
  )
}

// ─── GoalModal ────────────────────────────────────────────────────────────────

function GoalModal({
  visible,
  currentGoalMl,
  unit,
  onSave,
  onClose,
  isDark,
}: {
  visible: boolean
  currentGoalMl: number
  unit: WaterUnit
  onSave: (ml: number) => void
  onClose: () => void
  isDark: boolean
}) {
  const theme = isDark ? colors.dark : colors.light
  const displayGoal =
    unit === 'oz'
      ? (currentGoalMl / 29.5735).toFixed(0)
      : unit === 'cups'
      ? (currentGoalMl / ML_PER_CUP).toFixed(0)
      : String(Math.round(currentGoalMl))

  const [value, setValue] = useState(displayGoal)

  useEffect(() => {
    if (visible) setValue(displayGoal)
  }, [visible, displayGoal])

  const handleSave = () => {
    const num = parseFloat(value)
    if (isNaN(num) || num <= 0) {
      Alert.alert('Invalid', 'Please enter a positive number.')
      return
    }
    let ml: number
    if (unit === 'oz') ml = num * 29.5735
    else if (unit === 'cups') ml = num * ML_PER_CUP
    else ml = num
    onSave(Math.round(ml))
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: theme.card,
            borderRadius: 16,
            padding: 24,
            width: 280,
            gap: 16,
          }}
          onPress={() => {}}
        >
          <Text style={{ color: theme.foreground, fontSize: 17, fontWeight: '600', textAlign: 'center' }}>
            Set Daily Goal
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 10,
                padding: 12,
                color: theme.foreground,
                fontSize: 20,
                textAlign: 'center',
                backgroundColor: isDark ? '#1a1a1a' : '#f9f9f9',
              }}
              placeholderTextColor={theme.mutedForeground}
              selectTextOnFocus
            />
            <Text style={{ color: theme.mutedForeground, fontSize: 16 }}>
              {UNIT_LABELS[unit]}
            </Text>
          </View>
          <Pressable
            onPress={handleSave}
            style={{
              backgroundColor: theme.primary,
              borderRadius: 10,
              padding: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Save</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

// ─── CustomAmountModal ────────────────────────────────────────────────────────

function CustomAmountModal({
  visible,
  unit,
  onAdd,
  onClose,
  isDark,
}: {
  visible: boolean
  unit: WaterUnit
  onAdd: (ml: number) => void
  onClose: () => void
  isDark: boolean
}) {
  const theme = isDark ? colors.dark : colors.light
  const [value, setValue] = useState('')

  useEffect(() => {
    if (visible) setValue('')
  }, [visible])

  const handleAdd = () => {
    const num = parseFloat(value)
    if (isNaN(num) || num <= 0) {
      Alert.alert('Invalid', 'Please enter a positive number.')
      return
    }
    let ml: number
    if (unit === 'oz') ml = num * 29.5735
    else if (unit === 'cups') ml = num * ML_PER_CUP
    else ml = num
    onAdd(Math.round(ml))
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: theme.card,
            borderRadius: 16,
            padding: 24,
            width: 280,
            gap: 16,
          }}
          onPress={() => {}}
        >
          <Text style={{ color: theme.foreground, fontSize: 17, fontWeight: '600', textAlign: 'center' }}>
            Custom Amount
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
              placeholder={`Amount in ${UNIT_LABELS[unit]}`}
              autoFocus
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 10,
                padding: 12,
                color: theme.foreground,
                fontSize: 20,
                textAlign: 'center',
                backgroundColor: isDark ? '#1a1a1a' : '#f9f9f9',
              }}
              placeholderTextColor={theme.mutedForeground}
            />
            <Text style={{ color: theme.mutedForeground, fontSize: 16 }}>
              {UNIT_LABELS[unit]}
            </Text>
          </View>
          <Pressable
            onPress={handleAdd}
            style={{
              backgroundColor: theme.primary,
              borderRadius: 10,
              padding: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Add</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

// ─── WaterTracker (main) ──────────────────────────────────────────────────────

export default function WaterTracker() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const theme = isDark ? colors.dark : colors.light

  const log = useWaterStore(s => s.log)
  const unit = useWaterStore(s => s.unit)
  const justReachedGoal = useWaterStore(s => s.justReachedGoal)
  const addWater = useWaterStore(s => s.addWater)
  const setGoal = useWaterStore(s => s.setGoal)
  const setUnit = useWaterStore(s => s.setUnit)
  const dismissCelebration = useWaterStore(s => s.dismissCelebration)

  const [goalModalVisible, setGoalModalVisible] = useState(false)
  const [customModalVisible, setCustomModalVisible] = useState(false)

  // Ring animation using Animated API
  const progressAnim = useRef(new Animated.Value(0)).current

  const progress = Math.min(log.amountMl / log.goalMl, 1)

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false,
    }).start()
  }, [progress])

  // Convert to display unit
  const displayAmount =
    unit === 'oz'
      ? (log.amountMl / 29.5735).toFixed(1)
      : unit === 'cups'
      ? (log.amountMl / ML_PER_CUP).toFixed(1)
      : String(Math.round(log.amountMl))

  const displayGoal =
    unit === 'oz'
      ? (log.goalMl / 29.5735).toFixed(0)
      : unit === 'cups'
      ? (log.goalMl / ML_PER_CUP).toFixed(0)
      : String(Math.round(log.goalMl))

  // Quick-add amounts in ml
  const QUICK_ADDS = [
    { label: '+1 glass', ml: 250 },
    { label: '+500ml', ml: 500 },
  ]

  const progressArcLength = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, ARC_LENGTH],
  })

  // Ring color — blue gradient using primary, turns green at goal
  const ringColor = log.amountMl >= log.goalMl
    ? '#22c55e'
    : (isDark ? colors.dark.primary : colors.light.primary)

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginTop: 20,
        borderRadius: 16,
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: theme.border,
        overflow: 'hidden',
      }}
    >
      {/* Celebration emoji */}
      <CelebrationEmoji visible={justReachedGoal} onDismiss={dismissCelebration} />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 16 }}>💧</Text>
          <Text style={{ color: theme.foreground, fontSize: 15, fontWeight: '600', letterSpacing: 0.3 }}>
            Water
          </Text>
        </View>
        {/* Unit toggle */}
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {UNITS.map(u => (
            <Pressable
              key={u}
              onPress={() => setUnit(u)}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor: unit === u
                  ? (isDark ? colors.dark.primary : colors.light.primary)
                  : 'transparent',
              }}
            >
              <Text style={{
                color: unit === u ? '#fff' : theme.mutedForeground,
                fontSize: 12,
                fontWeight: unit === u ? '600' : '400',
              }}>
                {UNIT_LABELS[u]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Body: ring + stats */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 16 }}>
        {/* Progress ring */}
        <View style={{ width: RING_SIZE, height: RING_SIZE, position: 'relative' }}>
          <Svg width={RING_SIZE} height={RING_SIZE} style={{ transform: [{ rotate: '135deg' }] }}>
            {/* Background arc */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={theme.foreground}
              strokeOpacity={0.08}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
              strokeDasharray={`${ARC_LENGTH} ${GAP_LENGTH}`}
              strokeLinecap="round"
            />
            {/* Progress arc — driven by Animated interpolation */}
            <AnimatedCircle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={ringColor}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
              strokeDasharray={progressArcLength}
              strokeDashoffset={0}
              strokeLinecap="round"
            />
          </Svg>
          {/* Center label */}
          <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: theme.foreground, fontSize: 18, fontWeight: '700' }}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={{ flex: 1, gap: 8 }}>
          <View>
            <Text style={{ color: theme.foreground, fontSize: 22, fontWeight: '700' }}>
              {displayAmount}
            </Text>
            <Text style={{ color: theme.mutedForeground, fontSize: 12, marginTop: 1 }}>
              of {displayGoal} {UNIT_LABELS[unit]} goal
            </Text>
          </View>

          {/* Progress bar */}
          <View style={{ height: 4, backgroundColor: `${theme.foreground}14`, borderRadius: 4, overflow: 'hidden' }}>
            <Animated.View
              style={{
                height: '100%',
                borderRadius: 4,
                backgroundColor: ringColor,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              }}
            />
          </View>

          {/* Goal edit button */}
          <Pressable onPress={() => setGoalModalVisible(true)}>
            <Text style={{ color: isDark ? colors.dark.primary : colors.light.primary, fontSize: 12 }}>
              Edit goal
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Quick-add buttons */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 14, gap: 8 }}>
        {QUICK_ADDS.map(({ label, ml }) => (
          <Pressable
            key={label}
            onPress={() => addWater(ml)}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 9,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: isDark ? colors.dark.primary + '55' : colors.light.primary + '44',
              backgroundColor: pressed
                ? (isDark ? colors.dark.primary + '22' : colors.light.primary + '11')
                : (isDark ? colors.dark.primary + '11' : colors.light.primary + '08'),
              alignItems: 'center',
            })}
          >
            <Text style={{
              color: isDark ? colors.dark.primary : colors.light.primary,
              fontSize: 13,
              fontWeight: '600',
            }}>
              {label}
            </Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => setCustomModalVisible(true)}
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: 9,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: isDark ? colors.dark.border : colors.light.border,
            backgroundColor: pressed ? `${theme.foreground}08` : 'transparent',
            alignItems: 'center',
          })}
        >
          <Text style={{ color: theme.mutedForeground, fontSize: 13, fontWeight: '500' }}>
            + custom
          </Text>
        </Pressable>
      </View>

      {/* Modals */}
      <GoalModal
        visible={goalModalVisible}
        currentGoalMl={log.goalMl}
        unit={unit}
        onSave={setGoal}
        onClose={() => setGoalModalVisible(false)}
        isDark={isDark}
      />
      <CustomAmountModal
        visible={customModalVisible}
        unit={unit}
        onAdd={addWater}
        onClose={() => setCustomModalVisible(false)}
        isDark={isDark}
      />
    </View>
  )
}

// ─── AnimatedCircle ───────────────────────────────────────────────────────────
// Wrap SVG Circle with Animated to accept animated strokeDasharray
const AnimatedCircle = Animated.createAnimatedComponent(Circle)
