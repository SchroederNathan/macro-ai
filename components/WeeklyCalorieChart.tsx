import { Text } from '@/components/ui/Text'
import { colors } from '@/constants/colors'
import { getDailyLog } from '@/lib/storage'
import { formatDateKey } from '@/types/nutrition'
import { useEffect, useMemo, useState } from 'react'
import { View, useColorScheme, useWindowDimensions } from 'react-native'
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg'

const CHART_HEIGHT = 200
const BAR_RADIUS = 6
const PAD = { top: 28, right: 12, bottom: 32, left: 12 }

type DayData = { day: string; cal: number; date: Date }

type Props = { calorieGoal: number }

export default function WeeklyCalorieChart({ calorieGoal }: Props) {
  const { width: screenWidth } = useWindowDimensions()
  const colorScheme = useColorScheme()
  const theme = colors[colorScheme ?? 'light']
  const isDark = colorScheme === 'dark'

  const chartW = screenWidth - 48
  const drawW = chartW - PAD.left - PAD.right
  const drawH = CHART_HEIGHT - PAD.top - PAD.bottom

  const [data, setData] = useState<DayData[]>([])

  useEffect(() => {
    const out: DayData[] = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const log = getDailyLog(formatDateKey(d))
      out.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        cal: log?.totals.calories ?? 0,
        date: d,
      })
    }
    setData(out)
  }, [])

  const daysLogged = useMemo(() => data.filter(d => d.cal > 0).length, [data])

  const maxCal = useMemo(() => {
    const highest = Math.max(...data.map(d => d.cal), calorieGoal)
    return highest * 1.15 || 1
  }, [data, calorieGoal])

  if (data.length === 0) return null

  const barGap = 10
  const barWidth = (drawW - barGap * (data.length - 1)) / data.length
  const goalY = PAD.top + drawH - (calorieGoal / maxCal) * drawH

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <Text style={{ color: theme.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
          Weekly Calories
        </Text>
        <Text style={{ color: theme.muted, fontSize: 11 }}>
          {daysLogged}/7 days logged
        </Text>
      </View>

      <View style={{
        backgroundColor: isDark ? '#141414' : '#ffffff',
        borderRadius: 16,
        borderCurve: 'continuous' as any,
        padding: 8,
        borderWidth: 1,
        borderColor: isDark ? '#222' : '#e4e4e7',
      }}>
        <Svg width={chartW} height={CHART_HEIGHT}>
          {/* Goal dashed line */}
          <Line
            x1={PAD.left}
            y1={goalY}
            x2={chartW - PAD.right}
            y2={goalY}
            stroke={isDark ? 'rgba(239,68,68,0.5)' : 'rgba(239,68,68,0.4)'}
            strokeWidth={1.5}
            strokeDasharray="6,4"
          />

          {/* Goal label */}
          <SvgText
            x={chartW - PAD.right}
            y={goalY - 6}
            textAnchor="end"
            fontSize={9}
            fontWeight="600"
            fill={isDark ? 'rgba(239,68,68,0.6)' : 'rgba(239,68,68,0.5)'}
          >
            Goal {calorieGoal}
          </SvgText>

          {/* Bars */}
          {data.map((d, i) => {
            const barH = d.cal > 0 ? Math.max((d.cal / maxCal) * drawH, 4) : 0
            const x = PAD.left + i * (barWidth + barGap)
            const y = PAD.top + drawH - barH
            const isOver = d.cal > calorieGoal
            const barColor = d.cal === 0
              ? (isDark ? '#222' : '#e4e4e7')
              : isOver ? '#ef4444' : '#22c55e'

            return (
              <Rect
                key={`bar-${i}`}
                x={x}
                y={y}
                width={barWidth}
                height={barH || 2}
                rx={BAR_RADIUS}
                ry={BAR_RADIUS}
                fill={barColor}
                opacity={d.cal === 0 ? 0.4 : 0.85}
              />
            )
          })}

          {/* Calorie labels above bars */}
          {data.map((d, i) => {
            const barH = d.cal > 0 ? Math.max((d.cal / maxCal) * drawH, 4) : 0
            const x = PAD.left + i * (barWidth + barGap) + barWidth / 2
            const y = PAD.top + drawH - barH - 6

            if (d.cal === 0) return null

            return (
              <SvgText
                key={`label-${i}`}
                x={x}
                y={y}
                textAnchor="middle"
                fontSize={9}
                fontWeight="600"
                fill={isDark ? '#a3a3a3' : '#71717a'}
              >
                {d.cal}
              </SvgText>
            )
          })}

          {/* Day labels at bottom */}
          {data.map((d, i) => {
            const x = PAD.left + i * (barWidth + barGap) + barWidth / 2
            return (
              <SvgText
                key={`day-${i}`}
                x={x}
                y={CHART_HEIGHT - 8}
                textAnchor="middle"
                fontSize={10}
                fill={isDark ? '#666' : '#a1a1aa'}
              >
                {d.day}
              </SvgText>
            )
          })}
        </Svg>
      </View>
    </View>
  )
}
