import { colors } from '@/constants/colors'
import { useColorScheme, View } from 'react-native'
import { Text } from '@/components/ui/Text'
import Svg, { Circle } from 'react-native-svg'

type CalorieTrackerProps = {
  eaten: number
  target: number
}

export default function CalorieTracker({ eaten, target }: CalorieTrackerProps) {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? colors.dark : colors.light

  const remaining = Math.max(0, target - eaten)
  const progress = Math.min(eaten / target, 1)

  const size = 140
  const strokeWidth = 10 
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <View className="flex-row items-center justify-between px-6 py-6">
      {/* Remaining */}
      <View className="items-center flex-1">
        <Text className="text-foreground text-2xl font-semibold">{remaining}</Text>
        <Text className="text-muted text-xs uppercase tracking-wider mt-1">Remaining</Text>
      </View>

      {/* Circle with eaten calories */}
      <View className="items-center justify-center">
        <View style={{ width: size, height: size }}>
          <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
            {/* Background circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={theme.border}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={theme.primary}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </Svg>
          <View className="absolute inset-0 items-center justify-center">
            <Text className="text-foreground text-3xl font-bold">{eaten}</Text>
            <Text className="text-muted text-xs uppercase tracking-wider">Eaten</Text>
          </View>
        </View>
      </View>

      {/* Target */}
      <View className="items-center flex-1">
        <Text className="text-foreground text-2xl font-semibold">{target}</Text>
        <Text className="text-muted text-xs uppercase tracking-wider mt-1">Target</Text>
      </View>
    </View>
  )
}
