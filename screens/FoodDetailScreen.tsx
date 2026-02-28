import { AnimatedValue } from '@/components/ui/AnimatedValue'
import { StaggeredText } from '@/components/ui/StaggeredText'
import { Text } from '@/components/ui/Text'
import { colors } from '@/constants/colors'
import { useFoodDetailCallbacks } from '@/contexts/FoodDetailCallbackContext'
import { useDailyLogStore } from '@/stores'
import type { FoodConfirmationEntry } from '@/types/nutrition'
import { scaleMacros } from '@/types/nutrition'
import { GlassView } from 'expo-glass-effect'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ChevronLeft, Minus, Plus, Trash2 } from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, useColorScheme, View } from 'react-native'
import { Haptics } from 'react-native-nitro-haptics'
import Animated, {
  Easing,
  FadeInUp,
  FadeOutDown,
  Keyframe,
  LinearTransition,
  SharedTransition,
} from 'react-native-reanimated'

const SHARED_TRANSITION = SharedTransition.duration(550).springify()

const ENTER_DURATION = 350
const STAGGER_DELAY = 60

const enterStagger = (index: number) =>
  new Keyframe({
    0: { opacity: 0, transform: [{ translateY: 20 }] },
    100: { opacity: 1, transform: [{ translateY: 0 }], easing: Easing.out(Easing.ease) },
  }).duration(ENTER_DURATION).delay(50 + index * STAGGER_DELAY)
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const MACRO_COLORS = {
  protein: '#22C55E',
  carbs: '#FBBF24',
  fat: '#3B82F6',
}

const layoutTransition = LinearTransition.springify()

// MacroBar is rendered inline with per-segment shared tags

function MacroDetail({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View>
      <View className="flex-row items-center gap-1.5 mb-0.5">
        <View style={{ backgroundColor: color, width: 8, height: 8, borderRadius: 4 }} />
        <Text className="text-muted text-sm">{label}</Text>
      </View>
      <View className="flex-row items-end gap-1">
        <AnimatedValue value={value} className="text-foreground text-3xl font-semibold" />
        <AnimatedValue value="g" className="text-muted text-xl mb-1.25" />
      </View>
    </View>
  )
}

// Pending entry row with quantity controls
function PendingEntryRow({
  entry,
  index,
  isDark,
  onQuantityChange,
  onRemove,
}: {
  entry: FoodConfirmationEntry
  index: number
  isDark: boolean
  onQuantityChange: (index: number, quantity: number) => void
  onRemove: (index: number) => void
}) {
  const handleDecrement = useCallback(() => {
    Haptics.selection()
    if (entry.quantity <= 1) {
      onRemove(index)
    } else {
      onQuantityChange(index, entry.quantity - 1)
    }
  }, [entry.quantity, index, onQuantityChange, onRemove])

  const handleIncrement = useCallback(() => {
    Haptics.selection()
    onQuantityChange(index, entry.quantity + 1)
  }, [entry.quantity, index, onQuantityChange])

  const handleRemove = useCallback(() => {
    Haptics.notification('warning')
    onRemove(index)
  }, [index, onRemove])

  const scaled = useMemo(() => ({
    calories: Math.round(entry.nutrients.calories * entry.quantity),
    protein: Math.round(entry.nutrients.protein * entry.quantity),
    carbs: Math.round(entry.nutrients.carbs * entry.quantity),
    fat: Math.round(entry.nutrients.fat * entry.quantity),
  }), [entry.nutrients, entry.quantity])

  return (
    <Animated.View
      entering={FadeInUp.duration(250)}
      exiting={FadeOutDown.duration(150)}
      layout={layoutTransition}
    >
      <GlassView
        isInteractive
        style={{
          borderRadius: 16,
          borderCurve: 'continuous',
          padding: 14,
        }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-foreground text-base font-medium flex-1 mr-2" numberOfLines={1}>
            {entry.name}
          </Text>
          <Text className="text-muted text-xs">
            {entry.serving.amount * entry.quantity} {entry.serving.unit}
          </Text>
        </View>

        <View className="flex-row items-end gap-1 mb-3">
          <AnimatedValue value={scaled.calories} className="text-foreground text-xl font-bold" />
          <Text className="text-muted text-sm mb-0.5">kcal</Text>
        </View>

        {/* Macro chips */}
        <View className="flex-row items-center gap-3 mb-3">
          <View className="flex-row items-center gap-1">
            <View style={{ backgroundColor: MACRO_COLORS.protein, width: 7, height: 7, borderRadius: 4 }} />
            <Text className="text-muted text-xs">{scaled.protein}g</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View style={{ backgroundColor: MACRO_COLORS.carbs, width: 7, height: 7, borderRadius: 4 }} />
            <Text className="text-muted text-xs">{scaled.carbs}g</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View style={{ backgroundColor: MACRO_COLORS.fat, width: 7, height: 7, borderRadius: 4 }} />
            <Text className="text-muted text-xs">{scaled.fat}g</Text>
          </View>
        </View>

        {/* Controls */}
        <View
          className="flex-row items-center justify-between pt-3"
          style={{ borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
        >
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={handleDecrement}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-8 h-8 items-center justify-center rounded-full"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
            >
              <Minus size={16} color={isDark ? '#fff' : '#000'} />
            </Pressable>
            <Text className="text-foreground text-lg font-semibold w-8 text-center">
              {entry.quantity}
            </Text>
            <Pressable
              onPress={handleIncrement}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-8 h-8 items-center justify-center rounded-full"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
            >
              <Plus size={16} color={isDark ? '#fff' : '#000'} />
            </Pressable>
          </View>

          <Pressable
            onPress={handleRemove}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-8 h-8 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(239,68,68,0.15)' }}
          >
            <Trash2 size={16} color="#EF4444" />
          </Pressable>
        </View>
      </GlassView>
    </Animated.View>
  )
}

export default function FoodDetailScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ mode: string; entryId?: string; entries?: string }>()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const insets = useSafeAreaInsets()
  const callbacks = useFoodDetailCallbacks()

  const mode = params.mode as 'logged' | 'pending'

  // Store actions for logged mode
  const updateEntry = useDailyLogStore(s => s.updateEntry)
  const removeEntry = useDailyLogStore(s => s.removeEntry)

  // Parse pending entries from JSON params
  const pendingEntries: FoodConfirmationEntry[] = useMemo(() => {
    if (mode !== 'pending' || !params.entries) return []
    try {
      return JSON.parse(params.entries)
    } catch {
      return []
    }
  }, [mode, params.entries])

  // Get the logged entry from the store
  const storeEntry = useDailyLogStore(s =>
    mode === 'logged' && params.entryId
      ? s.log.entries.find(e => e.id === params.entryId)
      : undefined
  )

  // For logged mode, track local quantity so we can update optimistically
  const [loggedQuantity, setLoggedQuantity] = useState(storeEntry?.quantity ?? 1)

  // Scaled macros for logged mode
  const scaled = useMemo(() => {
    if (!storeEntry) return null
    return scaleMacros(storeEntry.snapshot.nutrients, loggedQuantity)
  }, [storeEntry, loggedQuantity])

  // Macro bar percentages for logged mode
  const macroPcts = useMemo(() => {
    if (!scaled) return { protein: 33, carbs: 33, fat: 33 }
    const pCals = scaled.protein * 4
    const cCals = scaled.carbs * 4
    const fCals = scaled.fat * 9
    const total = pCals + cCals + fCals
    return {
      protein: total > 0 ? (pCals / total) * 100 : 33,
      carbs: total > 0 ? (cCals / total) * 100 : 33,
      fat: total > 0 ? (fCals / total) * 100 : 33,
    }
  }, [scaled])

  // Totals for pending mode
  const pendingTotals = useMemo(() => {
    if (mode !== 'pending') return null
    return pendingEntries.reduce(
      (acc, e) => ({
        calories: acc.calories + Math.round(e.nutrients.calories * e.quantity),
        protein: acc.protein + Math.round(e.nutrients.protein * e.quantity),
        carbs: acc.carbs + Math.round(e.nutrients.carbs * e.quantity),
        fat: acc.fat + Math.round(e.nutrients.fat * e.quantity),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )
  }, [mode, pendingEntries])

  // Logged mode handlers
  const handleLoggedIncrement = useCallback(() => {
    if (!storeEntry) return
    Haptics.selection()
    const newQ = loggedQuantity + 1
    setLoggedQuantity(newQ)
    updateEntry(storeEntry.id, { quantity: newQ })
  }, [storeEntry, loggedQuantity, updateEntry])

  const handleLoggedDecrement = useCallback(() => {
    if (!storeEntry) return
    Haptics.selection()
    if (loggedQuantity <= 1) {
      handleLoggedDelete()
    } else {
      const newQ = loggedQuantity - 1
      setLoggedQuantity(newQ)
      updateEntry(storeEntry.id, { quantity: newQ })
    }
  }, [storeEntry, loggedQuantity, updateEntry])

  const handleLoggedDelete = useCallback(() => {
    if (!storeEntry) return
    Haptics.notification('warning')
    removeEntry(storeEntry.id)
    router.back()
  }, [storeEntry, removeEntry, router])

  // Pending mode handlers
  const handlePendingQuantityChange = useCallback((index: number, newQuantity: number) => {
    if (newQuantity < 1) {
      callbacks?.onPendingEntryRemove(index)
    } else {
      callbacks?.onPendingEntryUpdate(index, { quantity: newQuantity })
    }
  }, [callbacks])

  const handlePendingRemove = useCallback((index: number) => {
    callbacks?.onPendingEntryRemove(index)
  }, [callbacks])

  // Go back if logged entry was deleted externally
  useEffect(() => {
    if (mode === 'logged' && params.entryId && !storeEntry) {
      router.back()
    }
  }, [storeEntry, mode, params.entryId, router])

  return (
    <Pressable style={{ flex: 1 }} onPress={() => router.back()}>
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ================ LOGGED MODE ================ */}
        {mode === 'logged' && storeEntry && scaled && (
          <Pressable onPress={(e) => e.stopPropagation()}>
          <View style={{ position: 'relative' }}>
            {/* Card background — shared element that morphs from source card */}
            <Animated.View
              sharedTransitionTag={`food-card-${storeEntry.id}`}
              sharedTransitionStyle={SHARED_TRANSITION}
              className="bg-card"
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                borderRadius: 20,
                borderCurve: 'continuous',
              }}
            />

            {/* Content on top — NOT inside the shared container, so entering animations work */}
            <View style={{ padding: 20 }}>
              {/* Back button */}
              <Animated.View entering={enterStagger(0)} className="flex-row items-center mb-4">
                <Pressable
                  onPress={() => router.back()}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  className="w-8 h-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
                >
                  <ChevronLeft size={18} color={isDark ? '#fff' : '#000'} />
                </Pressable>
              </Animated.View>

              {/* Food name — shared element */}
              <Animated.Text
                sharedTransitionTag={`food-name-${storeEntry.id}`}
                sharedTransitionStyle={SHARED_TRANSITION}
                className="text-foreground text-2xl font-semibold mb-2 font-serif"
              >
                {storeEntry.snapshot.name}
              </Animated.Text>

              {/* Time + meal — shared element */}
              <Animated.Text
                sharedTransitionTag={`food-time-${storeEntry.id}`}
                sharedTransitionStyle={SHARED_TRANSITION}
                className="text-muted text-sm mb-6 font-serif"
              >
                {new Date(storeEntry.consumedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                {storeEntry.meal ? ` · ${storeEntry.meal.charAt(0).toUpperCase() + storeEntry.meal.slice(1)}` : ''}
              </Animated.Text>

              {/* Large calories — shared element */}
              <View className="flex-row items-end gap-2 mb-6">
                <Animated.Text
                  sharedTransitionTag={`food-cal-${storeEntry.id}`}
                  sharedTransitionStyle={SHARED_TRANSITION}
                  className="text-foreground text-5xl font-bold font-serif"
                >
                  {scaled.calories}
                </Animated.Text>
                <Animated.Text
                  sharedTransitionTag={`food-kcal-${storeEntry.id}`}
                  sharedTransitionStyle={SHARED_TRANSITION}
                  className="text-muted text-xl mb-2 font-serif"
                >
                  kcal
                </Animated.Text>
              </View>

              {/* Macro bar — each segment has its own shared tag */}
              <View style={{ flexDirection: 'row', height: 24, gap: 3, marginBottom: 16 }}>
                <Animated.View
                  sharedTransitionTag={`food-bar-protein-${storeEntry.id}`}
                  sharedTransitionStyle={SHARED_TRANSITION}
                  style={{ flex: macroPcts.protein, backgroundColor: MACRO_COLORS.protein, height: 24, borderTopLeftRadius: 8, borderBottomLeftRadius: 8, borderTopRightRadius: 4, borderBottomRightRadius: 4 }}
                />
                <Animated.View
                  sharedTransitionTag={`food-bar-carbs-${storeEntry.id}`}
                  sharedTransitionStyle={SHARED_TRANSITION}
                  style={{ flex: macroPcts.carbs, backgroundColor: MACRO_COLORS.carbs, height: 24, borderRadius: 4 }}
                />
                <Animated.View
                  sharedTransitionTag={`food-bar-fat-${storeEntry.id}`}
                  sharedTransitionStyle={SHARED_TRANSITION}
                  style={{ flex: macroPcts.fat, backgroundColor: MACRO_COLORS.fat, height: 24, borderTopLeftRadius: 4, borderBottomLeftRadius: 4, borderTopRightRadius: 8, borderBottomRightRadius: 8 }}
                />
              </View>

              {/* Macro details with shared macro values + dots */}
              <View className="flex-row justify-between mb-8">
                <View>
                  <View className="flex-row items-center gap-1.5 mb-0.5">
                    <Animated.View
                      sharedTransitionTag={`food-protein-dot-${storeEntry.id}`}
                      sharedTransitionStyle={SHARED_TRANSITION}
                      style={{ backgroundColor: MACRO_COLORS.protein, width: 8, height: 8, borderRadius: 4 }}
                    />
                    <StaggeredText phrases={['Protein']} visible initialDelay={150} intervalMs={999999} className="text-muted text-sm" />
                  </View>
                  <Animated.Text
                    sharedTransitionTag={`food-protein-${storeEntry.id}`}
                    sharedTransitionStyle={SHARED_TRANSITION}
                    className="text-foreground text-3xl font-semibold font-serif"
                  >
                    {scaled.protein}g
                  </Animated.Text>
                </View>
                <View>
                  <View className="flex-row items-center gap-1.5 mb-0.5">
                    <Animated.View
                      sharedTransitionTag={`food-carbs-dot-${storeEntry.id}`}
                      sharedTransitionStyle={SHARED_TRANSITION}
                      style={{ backgroundColor: MACRO_COLORS.carbs, width: 8, height: 8, borderRadius: 4 }}
                    />
                    <StaggeredText phrases={['Carbs']} visible initialDelay={200} intervalMs={999999} className="text-muted text-sm" />
                  </View>
                  <Animated.Text
                    sharedTransitionTag={`food-carbs-${storeEntry.id}`}
                    sharedTransitionStyle={SHARED_TRANSITION}
                    className="text-foreground text-3xl font-semibold font-serif"
                  >
                    {scaled.carbs}g
                  </Animated.Text>
                </View>
                <View>
                  <View className="flex-row items-center gap-1.5 mb-0.5">
                    <Animated.View
                      sharedTransitionTag={`food-fat-dot-${storeEntry.id}`}
                      sharedTransitionStyle={SHARED_TRANSITION}
                      style={{ backgroundColor: MACRO_COLORS.fat, width: 8, height: 8, borderRadius: 4 }}
                    />
                    <StaggeredText phrases={['Fats']} visible initialDelay={250} intervalMs={999999} className="text-muted text-sm" />
                  </View>
                  <Animated.Text
                    sharedTransitionTag={`food-fat-${storeEntry.id}`}
                    sharedTransitionStyle={SHARED_TRANSITION}
                    className="text-foreground text-3xl font-semibold font-serif"
                  >
                    {scaled.fat}g
                  </Animated.Text>
                </View>
              </View>

              {/* Serving info */}
              <Animated.View
                entering={enterStagger(2)}
                className="mb-6 pt-4"
                style={{ borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
              >
                <Text className="text-muted text-xs uppercase tracking-wider font-bold mb-2">Serving</Text>
                <Text className="text-foreground text-base">
                  {storeEntry.snapshot.serving.amount * loggedQuantity} {storeEntry.snapshot.serving.unit}
                  {loggedQuantity > 1 ? ` (${loggedQuantity} × ${storeEntry.snapshot.serving.amount} ${storeEntry.snapshot.serving.unit})` : ''}
                </Text>
              </Animated.View>

              {/* Quantity stepper */}
              <Animated.View
                entering={enterStagger(3)}
                className="flex-row items-center justify-between pt-4"
                style={{ borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
              >
                <View className="flex-row items-center gap-4">
                  <Pressable
                    onPress={handleLoggedDecrement}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="w-10 h-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
                  >
                    <Minus size={18} color={isDark ? '#fff' : '#000'} />
                  </Pressable>
                  <Text className="text-foreground text-2xl font-bold w-10 text-center">
                    {loggedQuantity}
                  </Text>
                  <Pressable
                    onPress={handleLoggedIncrement}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="w-10 h-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
                  >
                    <Plus size={18} color={isDark ? '#fff' : '#000'} />
                  </Pressable>
                </View>

                <Pressable
                  onPress={handleLoggedDelete}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  className="w-10 h-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: 'rgba(239,68,68,0.15)' }}
                >
                  <Trash2 size={18} color="#EF4444" />
                </Pressable>
              </Animated.View>
            </View>
          </View>
          </Pressable>
        )}

        {/* ================ PENDING MODE ================ */}
        {mode === 'pending' && pendingTotals && (
          <>
            {/* Totals card */}
            <Animated.View
              sharedTransitionTag="food-confirm-card"
              sharedTransitionStyle={SHARED_TRANSITION}
              className="bg-card"
              style={{
                borderRadius: 20,
                borderCurve: 'continuous',
                padding: 20,
                marginBottom: 16,
              }}
            >
                <Text className="text-foreground text-lg font-semibold mb-6">
                  {pendingEntries.length} {pendingEntries.length === 1 ? 'item' : 'items'}
                </Text>

                <View className="flex-row items-end gap-2 mb-6">
                  <AnimatedValue value={pendingTotals.calories} className="text-foreground text-5xl font-bold" />
                  <Text className="text-muted text-xl mb-2">kcal</Text>
                </View>

                <View className="mb-4">
                  {(() => {
                    const pC = pendingTotals.protein * 4, cC = pendingTotals.carbs * 4, fC = pendingTotals.fat * 9
                    const t = pC + cC + fC
                    const pp = t > 0 ? (pC / t) * 100 : 33, cp = t > 0 ? (cC / t) * 100 : 33, fp = t > 0 ? (fC / t) * 100 : 33
                    return (
                      <View style={{ flexDirection: 'row', height: 24, gap: 3 }}>
                        <View style={{ flex: pp, backgroundColor: MACRO_COLORS.protein, height: 24, borderTopLeftRadius: 8, borderBottomLeftRadius: 8, borderTopRightRadius: 4, borderBottomRightRadius: 4 }} />
                        <View style={{ flex: cp, backgroundColor: MACRO_COLORS.carbs, height: 24, borderRadius: 4 }} />
                        <View style={{ flex: fp, backgroundColor: MACRO_COLORS.fat, height: 24, borderTopLeftRadius: 4, borderBottomLeftRadius: 4, borderTopRightRadius: 8, borderBottomRightRadius: 8 }} />
                      </View>
                    )
                  })()}
                </View>

                <View className="flex-row justify-between">
                  <MacroDetail label="Protein" value={pendingTotals.protein} color={MACRO_COLORS.protein} />
                  <MacroDetail label="Carbs" value={pendingTotals.carbs} color={MACRO_COLORS.carbs} />
                  <MacroDetail label="Fats" value={pendingTotals.fat} color={MACRO_COLORS.fat} />
                </View>
            </Animated.View>

            {/* Individual entries */}
            <Text className="text-muted text-xs uppercase tracking-wider font-bold mb-3 ml-1">
              Items
            </Text>
            <View style={{ gap: 10 }}>
              {pendingEntries.map((pendingEntry, index) => (
                <PendingEntryRow
                  key={`${pendingEntry.name}-${pendingEntry.fdcId ?? index}`}
                  entry={pendingEntry}
                  index={index}
                  isDark={isDark}
                  onQuantityChange={handlePendingQuantityChange}
                  onRemove={handlePendingRemove}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </Pressable>
  )
}
