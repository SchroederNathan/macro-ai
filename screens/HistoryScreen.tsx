import { Text } from '@/components/ui/Text'
import WeeklyCalorieChart from '@/components/WeeklyCalorieChart'
import { colors } from '@/constants/colors'
import { useAuth } from '@/contexts/AuthContext'
import { clearAllData, getDailyLog } from '@/lib/storage'
import { useStreakStore } from '@/stores/streakStore'
import { useUserStore } from '@/stores/userStore'
import { formatDateKey } from '@/types/nutrition'
import { useEffect, useMemo } from 'react'
import { Pressable, ScrollView, View, useColorScheme } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { createMMKV } from 'react-native-mmkv'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type WeekDay = { cal: number; protein: number; logged: boolean }

function useWeeklyData() {
  return useMemo(() => {
    const days: WeekDay[] = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const log = getDailyLog(formatDateKey(d))
      const hasEntries = (log?.entries.length ?? 0) > 0
      days.push({
        cal: log?.totals.calories ?? 0,
        protein: log?.totals.protein ?? 0,
        logged: hasEntries,
      })
    }
    return days
  }, [])
}

function StreakCounter() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const { currentStreak, bestStreak, calculate } = useStreakStore()

  const pulseScale = useSharedValue(1)

  useEffect(() => {
    calculate()
  }, [calculate])

  useEffect(() => {
    if (currentStreak > 0) {
      pulseScale.value = withDelay(
        300,
        withRepeat(
          withSequence(
            withTiming(1.2, { duration: 600, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
        ),
      )
    }
  }, [currentStreak, pulseScale])

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }))

  return (
    <View style={{
      alignItems: 'center',
      paddingVertical: 20,
      backgroundColor: isDark ? '#141414' : '#ffffff',
      borderRadius: 16,
      borderCurve: 'continuous' as any,
      borderWidth: 1,
      borderColor: isDark ? '#222' : '#e4e4e7',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Animated.View style={pulseStyle}>
          <Text style={{ fontSize: 32 }}>🔥</Text>
        </Animated.View>
        <Text style={{
          fontSize: 36,
          fontWeight: '800',
          color: isDark ? '#f5f5f5' : '#0a0a0a',
        }}>
          {currentStreak}
        </Text>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: isDark ? '#a3a3a3' : '#71717a',
        }}>
          day streak
        </Text>
      </View>
      {bestStreak > 0 && (
        <Text style={{
          fontSize: 12,
          color: isDark ? '#666' : '#a1a1aa',
          marginTop: 6,
        }}>
          Best: {bestStreak} days
        </Text>
      )}
    </View>
  )
}

function WeeklySummaryCard({ days }: { days: WeekDay[] }) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const goals = useUserStore(s => s.goals)

  const loggedDays = days.filter(d => d.logged)
  const daysLoggedCount = loggedDays.length

  const avgCalories = daysLoggedCount > 0
    ? Math.round(loggedDays.reduce((s, d) => s + d.cal, 0) / daysLoggedCount)
    : 0

  const avgProtein = daysLoggedCount > 0
    ? Math.round(loggedDays.reduce((s, d) => s + d.protein, 0) / daysLoggedCount * 10) / 10
    : 0

  const totalCalories = days.reduce((s, d) => s + d.cal, 0)

  const statItems = [
    { label: 'Avg Calories', value: `${avgCalories}`, sub: `/ ${goals.calories} goal` },
    { label: 'Avg Protein', value: `${avgProtein}g`, sub: `/ ${goals.protein}g goal` },
    { label: 'Total Calories', value: `${totalCalories}`, sub: 'this week' },
    { label: 'Days Logged', value: `${daysLoggedCount}`, sub: 'out of 7' },
  ]

  return (
    <View>
      <Text style={{
        color: isDark ? '#a3a3a3' : '#71717a',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
      }}>
        Weekly Summary
      </Text>
      <View style={{
        backgroundColor: isDark ? '#141414' : '#ffffff',
        borderRadius: 16,
        borderCurve: 'continuous' as any,
        padding: 16,
        borderWidth: 1,
        borderColor: isDark ? '#222' : '#e4e4e7',
        flexDirection: 'row',
        flexWrap: 'wrap',
      }}>
        {statItems.map((item, i) => (
          <View key={item.label} style={{
            width: '50%',
            paddingVertical: 10,
            paddingHorizontal: 4,
            borderBottomWidth: i < 2 ? 1 : 0,
            borderBottomColor: isDark ? '#222' : '#e4e4e7',
          }}>
            <Text style={{ fontSize: 10, color: isDark ? '#666' : '#a1a1aa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {item.label}
            </Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: isDark ? '#f5f5f5' : '#0a0a0a', marginTop: 2 }}>
              {item.value}
            </Text>
            <Text style={{ fontSize: 11, color: isDark ? '#555' : '#a1a1aa', marginTop: 1 }}>
              {item.sub}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

export default function HistoryScreen() {
  const { signOut } = useAuth()
  const insets = useSafeAreaInsets()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const goals = useUserStore(s => s.goals)
  const weeklyData = useWeeklyData()

  const handleResetAndLogout = async () => {
    try {
      const authStorage = createMMKV({ id: 'supabase-auth' })
      authStorage.clearAll()
      clearAllData()
      await signOut()
    } catch (error) {
      console.error('Failed to reset and logout:', error)
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: isDark ? '#0a0a0a' : '#fafafa' }}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 40,
        paddingHorizontal: 16,
        gap: 20,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={{
        fontSize: 28,
        fontWeight: '800',
        color: isDark ? '#f5f5f5' : '#0a0a0a',
      }}>
        History
      </Text>

      <StreakCounter />

      <WeeklyCalorieChart calorieGoal={goals.calories} />

      <WeeklySummaryCard days={weeklyData} />

      <View style={{ alignItems: 'center', marginTop: 20 }}>
        <Pressable
          onPress={handleResetAndLogout}
          style={({ pressed }) => ({
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: pressed ? '#dc2626' : '#ef4444',
            borderRadius: 12,
            borderCurve: 'continuous' as any,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
            Reset Storage & Logout
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}
