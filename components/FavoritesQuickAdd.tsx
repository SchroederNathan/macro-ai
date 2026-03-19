import { GradientBorderCard } from '@/components/ui/GradientBorderCard'
import { Text } from '@/components/ui/Text'
import type { FavoriteTemplate } from '@/types/nutrition'
import { scaleMacros, sumMacros } from '@/types/nutrition'
import { Plus, Star, Trash2 } from 'lucide-react-native'
import { memo, useMemo } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { Haptics } from 'react-native-nitro-haptics'

type FavoritesQuickAddProps = {
  favorites: FavoriteTemplate[]
  onQuickAdd: (favorite: FavoriteTemplate) => void
  onRemove: (favorite: FavoriteTemplate) => void
}

const FavoriteCard = memo(function FavoriteCard({
  favorite,
  onQuickAdd,
  onRemove,
}: {
  favorite: FavoriteTemplate
  onQuickAdd: (favorite: FavoriteTemplate) => void
  onRemove: (favorite: FavoriteTemplate) => void
}) {
  const totals = useMemo(() => {
    if (favorite.entries.length === 1) {
      return scaleMacros(favorite.entries[0].snapshot.nutrients, favorite.entries[0].quantity)
    }

    return sumMacros(favorite.entries)
  }, [favorite.entries])

  const subtitle = favorite.type === 'meal'
    ? `${favorite.entries.length} items`
    : `${favorite.entries[0].quantity} × ${favorite.entries[0].snapshot.serving.amount} ${favorite.entries[0].snapshot.serving.unit}`

  return (
    <GradientBorderCard borderRadius={18} padding={14} style={{ width: 208 }}>
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 mr-3">
          <View className="flex-row items-center gap-1.5 mb-1">
            <Star size={14} color="#F59E0B" fill="#F59E0B" />
            <Text className="text-muted text-xs uppercase tracking-wider">Favorite</Text>
          </View>
          <Text className="text-foreground text-base font-semibold font-serif" numberOfLines={2}>
            {favorite.title}
          </Text>
          <Text className="text-muted text-xs mt-1">{subtitle}</Text>
        </View>

        <Pressable
          onPress={() => {
            Haptics.selection()
            onRemove(favorite)
          }}
          hitSlop={8}
          className="w-8 h-8 items-center justify-center rounded-full bg-red-500/15"
        >
          <Trash2 size={14} color="#EF4444" />
        </Pressable>
      </View>

      <View className="mb-4">
        <View className="flex-row items-end gap-1">
          <Text className="text-foreground text-2xl font-bold font-serif">{totals.calories}</Text>
          <Text className="text-muted text-sm mb-0.5">kcal</Text>
        </View>
        <Text className="text-muted text-xs mt-1">
          P {totals.protein}g · C {totals.carbs}g · F {totals.fat}g
        </Text>
      </View>

      <Pressable
        onPress={() => {
          Haptics.selection()
          onQuickAdd(favorite)
        }}
        className="rounded-full bg-foreground px-4 py-3 flex-row items-center justify-center gap-2"
      >
        <Plus size={16} color="#FFFFFF" />
        <Text className="text-background text-sm font-semibold">Quick add</Text>
      </Pressable>
    </GradientBorderCard>
  )
})

export function FavoritesQuickAdd({ favorites, onQuickAdd, onRemove }: FavoritesQuickAddProps) {
  if (favorites.length === 0) {
    return (
      <View className="mb-6">
        <Text className="text-muted text-xs uppercase tracking-wider font-bold mb-3">
          Favorites
        </Text>
        <GradientBorderCard borderRadius={18} padding={16}>
          <Text className="text-foreground text-base font-medium font-serif mb-1">
            Save foods you log a lot
          </Text>
          <Text className="text-muted text-sm">
            Open any logged food or meal and tap the star to keep it here for one-tap logging.
          </Text>
        </GradientBorderCard>
      </View>
    )
  }

  return (
    <View className="mb-6">
      <Text className="text-muted text-xs uppercase tracking-wider font-bold mb-3">
        Favorites
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 4 }}>
        {favorites.map(favorite => (
          <FavoriteCard
            key={favorite.id}
            favorite={favorite}
            onQuickAdd={onQuickAdd}
            onRemove={onRemove}
          />
        ))}
      </ScrollView>
    </View>
  )
}
