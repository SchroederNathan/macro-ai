import { View } from 'react-native'
import { Text } from '@/components/ui/Text'

type MacroProgressProps = {
  carbs: number
  carbsGoal: number
  protein: number
  proteinGoal: number
  fat: number
  fatGoal: number
}

type MacroBarProps = {
  label: string
  current: number
  goal: number
}

function MacroBar({ label, current, goal }: MacroBarProps) {
  const progress = Math.min(current / goal, 1)
  const percentage = progress * 100

  return (
    <View className="flex-1 items-center">
      <Text className="text-foreground text-xs uppercase tracking-wider mb-2">{label}</Text>
      <View className="w-full h-1 bg-foreground/10 rounded-full overflow-hidden">
        <View
          className="h-full bg-foreground rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </View>
      <Text className="text-foreground text-sm mt-2">
        {Math.round(current)} / {goal}g
      </Text>
    </View>
  )
}

export default function MacroProgress({
  carbs,
  carbsGoal,
  protein,
  proteinGoal,
  fat,
  fatGoal,
}: MacroProgressProps) {
  return (
    <View className="flex-row px-6 gap-8">
      <MacroBar label="CARBS" current={carbs} goal={carbsGoal} />
      <MacroBar label="PROTEIN" current={protein} goal={proteinGoal} />
      <MacroBar label="FAT" current={fat} goal={fatGoal} />
    </View>
  )
}
