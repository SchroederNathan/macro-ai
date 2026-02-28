import { colors } from '@/constants/colors'
import { getDailyLog } from '@/lib/storage'
import { formatDateKey } from '@/types/nutrition'
import { memo, useCallback, useMemo } from 'react'
import { Pressable, StyleSheet, useColorScheme, View } from 'react-native'
import { Haptics } from 'react-native-nitro-haptics'
import Svg, { Circle } from 'react-native-svg'
import { Text } from './ui/Text'

type DatePickerProps = {
  selectedDate: string
  calorieGoal: number
  currentDateCalories: number
  onSelectDate: (date: string) => void
}

type DatePickerItemProps = {
  date: Date
  dateKey: string
  isSelected: boolean
  isFuture: boolean
  caloriesConsumed: number
  calorieGoal: number
  onPress: (dateKey: string) => void
}

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const CIRCLE_SIZE = 40
const STROKE_WIDTH = 2.5
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const DatePickerItem = memo(function DatePickerItem({
  date,
  dateKey,
  isSelected,
  isFuture,
  caloriesConsumed,
  calorieGoal,
  onPress,
}: DatePickerItemProps) {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? colors.dark : colors.light

  const dayLetter = DAY_LETTERS[date.getDay()]
  const dateNumber = date.getDate()

  const hasLogs = caloriesConsumed > 0
  const progress = Math.min(caloriesConsumed / calorieGoal, 1)
  const progressArcLength = CIRCUMFERENCE * progress

  const handlePress = useCallback(() => {
    Haptics.selection()
    onPress(dateKey)
  }, [onPress, dateKey])

  const circleElement = isFuture ? null : !hasLogs ? (
    <Svg
      width={CIRCLE_SIZE}
      height={CIRCLE_SIZE}
      style={{ position: 'absolute' }}
    >
      <Circle
        cx={CIRCLE_SIZE / 2}
        cy={CIRCLE_SIZE / 2}
        r={RADIUS}
        stroke={theme.foreground}
        strokeWidth={STROKE_WIDTH}
        fill="transparent"
        strokeDasharray="4 4"
        strokeDashoffset={-5}
      />
    </Svg>
  ) : (
    <Svg
      width={CIRCLE_SIZE}
      height={CIRCLE_SIZE}
      style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
    >
      {/* Background circle */}
      <Circle
        cx={CIRCLE_SIZE / 2}
        cy={CIRCLE_SIZE / 2}
        r={RADIUS}
        strokeWidth={STROKE_WIDTH}
        fill="transparent"
      />
      {/* Progress arc */}
      <Circle
        cx={CIRCLE_SIZE / 2}
        cy={CIRCLE_SIZE / 2}
        r={RADIUS}
        stroke={theme.foreground}
        strokeWidth={STROKE_WIDTH}
        fill="transparent"
        strokeDasharray={`${progressArcLength} ${CIRCUMFERENCE}`}
        strokeLinecap="round"
      />
    </Svg>
  )

  return (
    <Pressable onPress={handlePress} style={styles.itemContainer}>
      <Text className="text-foreground text-xs mb-2 font-bold">
        {dayLetter}
      </Text>
      <View className="w-10 h-10 items-center justify-center">
        {circleElement}
        <Text
          className={`${isSelected ? "font-bold" : "font-normal"} text-foreground text-xs font-bold`}
        >
          {dateNumber}
        </Text>
      </View>
    </Pressable>
  )
})

type DateItem = {
  date: Date
  dateKey: string
  isFuture: boolean
  caloriesConsumed: number
}

export default function DatePicker({
  selectedDate,
  calorieGoal,
  currentDateCalories,
  onSelectDate,
}: DatePickerProps) {
  const handleDatePress = useCallback((dateKey: string) => {
    onSelectDate(dateKey)
  }, [onSelectDate])

  const dateItems = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayKey = formatDateKey(today)

    const items: DateItem[] = []

    // 5 days in the past
    for (let i = 5; i >= 1; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateKey = formatDateKey(date)
      const log = getDailyLog(dateKey)
      items.push({
        date,
        dateKey,
        isFuture: false,
        caloriesConsumed: log?.totals.calories ?? 0,
      })
    }

    // Today
    const todayLog = getDailyLog(todayKey)
    items.push({
      date: new Date(today),
      dateKey: todayKey,
      isFuture: false,
      caloriesConsumed: todayLog?.totals.calories ?? 0,
    })

    // 1 day in the future
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    items.push({
      date: tomorrow,
      dateKey: formatDateKey(tomorrow),
      isFuture: true,
      caloriesConsumed: 0,
    })

    return items
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, currentDateCalories]) // Re-compute when selected date or calorie data changes

  return (
    <View
      style={{
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
      }}
    >
      {dateItems.map((item) => (
        <DatePickerItem
          key={item.dateKey}
          date={item.date}
          dateKey={item.dateKey}
          isSelected={item.dateKey === selectedDate}
          isFuture={item.isFuture}
          caloriesConsumed={item.caloriesConsumed}
          calorieGoal={calorieGoal}
          onPress={handleDatePress}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  itemContainer: {
    alignItems: 'center',
    paddingVertical: 4,
  },

  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 14,
  },
})
