import { Text } from '@/components/ui/Text'
import { AnimatedValue } from '@/components/ui/AnimatedValue'
import { colors } from '@/constants/colors'
import { GlassView } from 'expo-glass-effect'
import { Pressable, useColorScheme, View } from 'react-native'
import { Haptics } from 'react-native-nitro-haptics'
import { X } from 'lucide-react-native'
import Animated, {
  FadeIn,
  FadeOut,
  FadeInDown,
  FadeOutUp,
  LinearTransition,
} from 'react-native-reanimated'

export type FoodConfirmationEntry = {
  name: string
  quantity: number
  serving: { amount: number; unit: string; gramWeight: number }
  nutrients: { calories: number; protein: number; carbs: number; fat: number }
  meal?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  fdcId?: number
}

type FoodConfirmationCardProps = {
  entries: FoodConfirmationEntry[]
  onConfirm: () => void
  onRemove: (index: number) => void
}

function getDefaultMeal(): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const hour = new Date().getHours()
  if (hour < 10) return 'breakfast'
  if (hour < 14) return 'lunch'
  if (hour < 20) return 'dinner'
  return 'snack'
}

function formatMealName(meal: string): string {
  return meal.charAt(0).toUpperCase() + meal.slice(1)
}

function formatServing(quantity: number, serving: { amount: number; unit: string }): string {
  const total = quantity * serving.amount
  // If it's just "1 serving" or similar, simplify
  if (total === 1 && serving.unit.toLowerCase() === 'serving') {
    return '1 serving'
  }
  return `${total} ${serving.unit}`
}

export function FoodConfirmationCard({ entries, onConfirm, onRemove }: FoodConfirmationCardProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const theme = isDark ? colors.dark : colors.light

  const isEmpty = entries.length === 0

  // Use first entry's meal or default
  const meal = entries[0]?.meal || getDefaultMeal()

  // Calculate totals across all entries
  const totals = entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.nutrients.calories * entry.quantity,
      protein: acc.protein + entry.nutrients.protein * entry.quantity,
      carbs: acc.carbs + entry.nutrients.carbs * entry.quantity,
      fat: acc.fat + entry.nutrients.fat * entry.quantity,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const totalCalories = Math.round(totals.calories)
  const totalProtein = Math.round(totals.protein * 10) / 10
  const totalCarbs = Math.round(totals.carbs * 10) / 10
  const totalFat = Math.round(totals.fat * 10) / 10

  const handleConfirm = () => {
    if (isEmpty) return
    Haptics.selection()
    onConfirm()
  }

  const handleRemove = (index: number) => {
    Haptics.selection()
    onRemove(index)
  }

  return (
    <View className="px-4">
      <GlassView
        isInteractive
        style={{
          borderRadius: 20,
          borderCurve: 'continuous',
          padding: 16,
        }}
      >
        {/* Food items or empty state */}
        {isEmpty ? (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            className="py-2"
          >
            <Text className="text-muted text-base text-center">
              Add food to continue...
            </Text>
          </Animated.View>
        ) : (
          entries.map((entry, index) => (
            <Animated.View
              key={`${entry.name}-${entry.fdcId ?? index}`}
              entering={FadeInDown.duration(250)}
              exiting={FadeOutUp.duration(200)}
              layout={LinearTransition.springify().damping(20).stiffness(200)}
              className={`flex-row items-center ${index > 0 ? 'mt-2' : ''}`}
            >
              <View className="flex-1">
                <AnimatedValue
                  value={entry.name}
                  className="text-foreground text-lg font-semibold"
                />
                <Text className="text-muted text-sm">
                  {formatServing(entry.quantity, entry.serving)}
                  {index === 0 && `  •  ${formatMealName(meal)}`}
                </Text>
              </View>
              <Pressable
                onPress={() => handleRemove(index)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="ml-2 p-1"
              >
                <X size={18} color={theme.muted} />
              </Pressable>
            </Animated.View>
          ))
        )}

        {/* Divider */}
        <View
          className="my-3"
          style={{ height: 1, backgroundColor: theme.border }}
        />

        {/* Macros row - show totals with animation */}
        <View className="flex-row justify-between">
          {/* Calories */}
          <View className="items-center flex-1">
            <AnimatedValue value={totalCalories} />
            <Text className="text-muted text-xs">cal</Text>
          </View>

          {/* Protein */}
          <View className="items-center flex-1">
            <AnimatedValue value={totalProtein} suffix="g" />
            <Text className="text-muted text-xs">Protein</Text>
          </View>

          {/* Carbs */}
          <View className="items-center flex-1">
            <AnimatedValue value={totalCarbs} suffix="g" />
            <Text className="text-muted text-xs">Carbs</Text>
          </View>

          {/* Fat */}
          <View className="items-center flex-1">
            <AnimatedValue value={totalFat} suffix="g" />
            <Text className="text-muted text-xs">Fat</Text>
          </View>
        </View>

        {/* Divider */}
        <View
          className="my-3"
          style={{ height: 1, backgroundColor: theme.border }}
        />

        {/* Log button (full width, disabled when empty) */}
        <GlassView
          style={{
            borderRadius: 12,
            borderCurve: 'continuous',
            paddingVertical: 12,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isEmpty ? 0.5 : 1,
          }}
          tintColor={isEmpty ? undefined : theme.primary}
          isInteractive={!isEmpty}
          onTouchEnd={handleConfirm}
        >
          <Text className={`text-base font-semibold ${isEmpty ? 'text-muted' : 'text-white'}`}>
            Log
          </Text>
        </GlassView>
      </GlassView>
    </View>
  )
}
