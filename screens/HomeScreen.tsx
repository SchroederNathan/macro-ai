import CalorieTracker from "@/components/CalorieTracker"
import DatePicker from "@/components/DatePicker"
import { FoodHistory } from "@/components/FoodEntryCard"
import MacroProgress from "@/components/MacroProgress"
import WeeklyCalorieChart from "@/components/WeeklyCalorieChart"
import { useDailyLogStore, useUserStore } from "@/stores"
import { Haptics } from "react-native-nitro-haptics"
import { useCallback, useEffect } from "react"
import { ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useHeaderHeight } from "@react-navigation/elements"

export default function HomeScreen() {
    const headerHeight = useHeaderHeight()
    const insets = useSafeAreaInsets()

    // Subscribe to specific values from stores (this ensures re-renders)
    const calories = useDailyLogStore(state => state.log.totals.calories)
    const protein = useDailyLogStore(state => state.log.totals.protein)
    const carbs = useDailyLogStore(state => state.log.totals.carbs)
    const fat = useDailyLogStore(state => state.log.totals.fat)
    const currentDate = useDailyLogStore(state => state.currentDate)
    const loadDailyLog = useDailyLogStore(state => state.load)
    const targetCalories = useUserStore(state => state.goals.calories)
    const proteinGoal = useUserStore(state => state.goals.protein)
    const carbsGoal = useUserStore(state => state.goals.carbs)
    const fatGoal = useUserStore(state => state.goals.fat)
    const entries = useDailyLogStore(state => state.log.entries)
    const removeEntry = useDailyLogStore(state => state.removeEntry)
    const updateEntry = useDailyLogStore(state => state.updateEntry)
    const loadUserGoals = useUserStore(state => state.load)

    // Load stores on mount
    useEffect(() => {
        loadDailyLog()
        loadUserGoals()
    }, [loadDailyLog, loadUserGoals])

    // Debug
    useEffect(() => {
        console.log('[HomeScreen] calories:', calories, 'target:', targetCalories)
    }, [calories, targetCalories])

    const handleDateSelect = useCallback((date: string) => {
        loadDailyLog(date)
    }, [loadDailyLog])

    const handleRemoveEntry = useCallback((entryId: string) => {
        removeEntry(entryId)
    }, [removeEntry])

    const handleQuantityChange = useCallback((entryId: string, newQuantity: number) => {
        if (newQuantity < 1) {
            removeEntry(entryId)
        } else {
            updateEntry(entryId, { quantity: newQuantity })
        }
    }, [removeEntry, updateEntry])

    return (
        <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: insets.bottom + 20 }}
            showsVerticalScrollIndicator={false}
        >
            <DatePicker
                selectedDate={currentDate}
                calorieGoal={targetCalories}
                onSelectDate={handleDateSelect}
            />
            <CalorieTracker
                eaten={calories}
                target={targetCalories}
            />
            <MacroProgress
                carbs={carbs}
                carbsGoal={carbsGoal}
                protein={protein}
                proteinGoal={proteinGoal}
                fat={fat}
                fatGoal={fatGoal}
            />
            <View className="px-4 mt-6 pb-4">
                <FoodHistory
                    entries={entries}
                    onRemove={handleRemoveEntry}
                    onQuantityChange={handleQuantityChange}
                />
                {/* <WeeklyCalorieChart calorieGoal={targetCalories} /> */}
            </View>
        </ScrollView>
    )
}
