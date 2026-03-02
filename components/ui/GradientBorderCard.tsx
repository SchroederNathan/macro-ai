import { colors } from '@/constants/colors'
import MaskedView from '@react-native-masked-view/masked-view'
import { LinearGradient } from 'expo-linear-gradient'
import { useColorScheme, View, type ViewStyle } from 'react-native'

type BorderRadius =
  | number
  | { topLeft?: number; topRight?: number; bottomLeft?: number; bottomRight?: number }

type Padding =
  | number
  | { padding?: number; paddingTop?: number; paddingBottom?: number; paddingLeft?: number; paddingRight?: number; paddingHorizontal?: number; paddingVertical?: number }

type GradientBorderCardProps = {
  children: React.ReactNode
  borderRadius?: BorderRadius
  borderWidth?: number
  padding?: Padding
  style?: ViewStyle
}

function resolveRadius(r: BorderRadius | undefined) {
  if (r == null) return { borderRadius: 0 }
  if (typeof r === 'number') return { borderRadius: r }
  return {
    borderTopLeftRadius: r.topLeft ?? 0,
    borderTopRightRadius: r.topRight ?? 0,
    borderBottomLeftRadius: r.bottomLeft ?? 0,
    borderBottomRightRadius: r.bottomRight ?? 0,
  }
}

function resolvePadding(p: Padding | undefined): ViewStyle {
  if (p == null) return {}
  if (typeof p === 'number') return { padding: p }
  return p
}

export function GradientBorderCard({
  children,
  borderRadius,
  borderWidth = 1,
  padding,
  style,
}: GradientBorderCardProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const theme = isDark ? colors.dark : colors.light

  const radiusStyle = resolveRadius(borderRadius)
  const topWidth = borderWidth * 2
  const paddingStyle = resolvePadding(padding)

  return (
    <View style={[{ overflow: 'hidden', borderCurve: 'continuous' }, radiusStyle, style]}>
      {/* Semi-transparent background */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.card + 'B3',
        }}
      />

      {/* Gradient inner border */}
      <MaskedView
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        maskElement={
          <View
            style={[
              {
                flex: 1,
                borderTopWidth: topWidth,
                borderLeftWidth: borderWidth,
                borderRightWidth: borderWidth,
                borderBottomWidth: borderWidth,
                borderColor: 'white',
                backgroundColor: 'transparent',
              },
              radiusStyle,
            ]}
          />
        }
      >
        <LinearGradient
          colors={[theme.border, theme.border + '33']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ flex: 1 }}
        />
      </MaskedView>

      {/* Content */}
      <View style={paddingStyle}>{children}</View>
    </View>
  )
}
