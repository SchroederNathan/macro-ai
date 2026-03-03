import { AnimatedValue } from '@/components/ui/AnimatedValue'
import { Text } from '@/components/ui/Text'
import { Beef, Droplet, Wheat } from 'lucide-react-native'
import { View } from 'react-native'

const MACRO_ICONS: Record<string, typeof Beef> = {
  Protein: Beef,
  Carbs: Wheat,
  Fats: Droplet,
}

type MacroDetailProps = {
  label: string
  value: number
  color: string
  animated?: boolean
}

export function MacroDetail({ label, value, color, animated = false }: MacroDetailProps) {
  const Icon = MACRO_ICONS[label]

  return (
    <View>
      <View className="flex-row items-center gap-1.5 mb-0.5">
        {Icon ? <Icon size={14} color={color} /> : <View style={{ backgroundColor: color, width: 8, height: 8, borderRadius: 4 }} />}
        <Text className="text-muted text-sm">{label}</Text>
      </View>
      <View className="flex-row items-end gap-1">
        {animated ? (
          <>
            <AnimatedValue value={value} className="text-foreground text-3xl font-semibold" />
            <AnimatedValue value="g" className="text-muted text-xl mb-1.25" />
          </>
        ) : (
          <>
            <Text className="text-foreground text-3xl font-semibold">{value}</Text>
            <Text className="text-muted text-xl mb-1.25">g</Text>
          </>
        )}
      </View>
    </View>
  )
}
