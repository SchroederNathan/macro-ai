import { Text } from '@/components/ui/Text'
import { useFoodDetailCallbacks } from '@/contexts/FoodDetailCallbackContext'
import { useDailyLogStore } from '@/stores'
import type { FoodConfirmationEntry } from '@/types/nutrition'
import { scaleMacros } from '@/types/nutrition'
import { GlassView } from 'expo-glass-effect'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Minus, Plus, Trash2 } from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, useColorScheme, View } from 'react-native'
import { Haptics } from 'react-native-nitro-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const MACRO_COLORS = {
  protein: '#22C55E',
  carbs: '#FBBF24',
  fat: '#3B82F6',
}

function MacroBar({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const pCals = protein * 4
  const cCals = carbs * 4
  const fCals = fat * 9
  const total = pCals + cCals + fCals
  const pp = total > 0 ? (pCals / total) * 100 : 33
  const cp = total > 0 ? (cCals / total) * 100 : 33
  const fp = total > 0 ? (fCals / total) * 100 : 33

  return (
    <View style={{ flexDirection: 'row', height: 24, gap: 3 }}>
      <View style={{ flex: pp, backgroundColor: MACRO_COLORS.protein, height: 24, borderTopLeftRadius: 8, borderBottomLeftRadius: 8, borderTopRightRadius: 4, borderBottomRightRadius: 4 }} />
      <View style={{ flex: cp, backgroundColor: MACRO_COLORS.carbs, height: 24, borderRadius: 4 }} />
      <View style={{ flex: fp, backgroundColor: MACRO_COLORS.fat, height: 24, borderTopLeftRadius: 4, borderBottomLeftRadius: 4, borderTopRightRadius: 8, borderBottomRightRadius: 8 }} />
    </View>
  )
}

function MacroDetail({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View>
      <View className="flex-row items-center gap-1.5 mb-0.5">
        <View style={{ backgroundColor: color, width: 8, height: 8, borderRadius: 4 }} />
        <Text className="text-muted text-sm">{label}</Text>
      </View>
      <View className="flex-row items-end gap-1">
        <Text className="text-foreground text-3xl font-semibold">{value}</Text>
        <Text className="text-muted text-xl mb-1.25">g</Text>
      </View>
    </View>
  )
}

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
        <Text className="text-foreground text-xl font-bold">{scaled.calories}</Text>
        <Text className="text-muted text-sm mb-0.5">kcal</Text>
      </View>

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

  const updateEntry = useDailyLogStore(s => s.updateEntry)
  const removeEntry = useDailyLogStore(s => s.removeEntry)

  const pendingEntries: FoodConfirmationEntry[] = useMemo(() => {
    if (mode !== 'pending' || !params.entries) return []
    try {
      return JSON.parse(params.entries)
    } catch {
      return []
    }
  }, [mode, params.entries])

  const storeEntry = useDailyLogStore(s =>
    mode === 'logged' && params.entryId
      ? s.log.entries.find(e => e.id === params.entryId)
      : undefined
  )

  const [loggedQuantity, setLoggedQuantity] = useState(storeEntry?.quantity ?? 1)

  const scaled = useMemo(() => {
    if (!storeEntry) return null
    return scaleMacros(storeEntry.snapshot.nutrients, loggedQuantity)
  }, [storeEntry, loggedQuantity])

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

  const handleLoggedDelete = useCallback(() => {
    if (!storeEntry) return
    Haptics.notification('warning')
    removeEntry(storeEntry.id)
    router.back()
  }, [storeEntry, removeEntry, router])

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
  }, [storeEntry, loggedQuantity, updateEntry, handleLoggedDelete])

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

  useEffect(() => {
    if (mode === 'logged' && params.entryId && !storeEntry) {
      router.back()
    }
  }, [storeEntry, mode, params.entryId, router])

  return (
    <View className="px-5" style={{ paddingTop: 4, paddingBottom: insets.bottom + 24 }}>
      {/* LOGGED MODE */}
      {mode === 'logged' && storeEntry && scaled && (
        <View>
          <Text className="text-foreground text-2xl font-semibold mb-2 font-serif">
            {storeEntry.snapshot.name}
          </Text>

          <Text className="text-muted text-sm mb-6 font-serif">
            {new Date(storeEntry.consumedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            {storeEntry.meal ? ` · ${storeEntry.meal.charAt(0).toUpperCase() + storeEntry.meal.slice(1)}` : ''}
          </Text>

          <View className="flex-row items-end gap-2 mb-6">
            <Text className="text-foreground text-5xl font-bold font-serif">
              {scaled.calories}
            </Text>
            <Text className="text-muted text-xl mb-2 font-serif">
              kcal
            </Text>
          </View>

          <View className="mb-4">
            <MacroBar protein={scaled.protein} carbs={scaled.carbs} fat={scaled.fat} />
          </View>

          <View className="flex-row justify-between mb-8">
            <View>
              <View className="flex-row items-center gap-1.5 mb-0.5">
                <View style={{ backgroundColor: MACRO_COLORS.protein, width: 8, height: 8, borderRadius: 4 }} />
                <Text className="text-muted text-sm">Protein</Text>
              </View>
              <Text className="text-foreground text-3xl font-semibold font-serif">
                {scaled.protein}g
              </Text>
            </View>
            <View>
              <View className="flex-row items-center gap-1.5 mb-0.5">
                <View style={{ backgroundColor: MACRO_COLORS.carbs, width: 8, height: 8, borderRadius: 4 }} />
                <Text className="text-muted text-sm">Carbs</Text>
              </View>
              <Text className="text-foreground text-3xl font-semibold font-serif">
                {scaled.carbs}g
              </Text>
            </View>
            <View>
              <View className="flex-row items-center gap-1.5 mb-0.5">
                <View style={{ backgroundColor: MACRO_COLORS.fat, width: 8, height: 8, borderRadius: 4 }} />
                <Text className="text-muted text-sm">Fats</Text>
              </View>
              <Text className="text-foreground text-3xl font-semibold font-serif">
                {scaled.fat}g
              </Text>
            </View>
          </View>

          <View
            className="mb-6 pt-4"
            style={{ borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
          >
            <Text className="text-muted text-xs uppercase tracking-wider font-bold mb-2">Serving</Text>
            <Text className="text-foreground text-base">
              {storeEntry.snapshot.serving.amount * loggedQuantity} {storeEntry.snapshot.serving.unit}
              {loggedQuantity > 1 ? ` (${loggedQuantity} × ${storeEntry.snapshot.serving.amount} ${storeEntry.snapshot.serving.unit})` : ''}
            </Text>
          </View>

          <View
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
          </View>
        </View>
      )}

      {/* PENDING MODE */}
      {mode === 'pending' && pendingTotals && (
        <>
          <View style={{ marginBottom: 16 }}>
            <Text className="text-foreground text-lg font-semibold mb-6">
              {pendingEntries.length} {pendingEntries.length === 1 ? 'item' : 'items'}
            </Text>

            <View className="flex-row items-end gap-2 mb-6">
              <Text className="text-foreground text-5xl font-bold">{pendingTotals.calories}</Text>
              <Text className="text-muted text-xl mb-2">kcal</Text>
            </View>

            <View className="mb-4">
              <MacroBar protein={pendingTotals.protein} carbs={pendingTotals.carbs} fat={pendingTotals.fat} />
            </View>

            <View className="flex-row justify-between">
              <MacroDetail label="Protein" value={pendingTotals.protein} color={MACRO_COLORS.protein} />
              <MacroDetail label="Carbs" value={pendingTotals.carbs} color={MACRO_COLORS.carbs} />
              <MacroDetail label="Fats" value={pendingTotals.fat} color={MACRO_COLORS.fat} />
            </View>
          </View>

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
    </View>
  )
}
