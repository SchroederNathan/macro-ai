import CalorieTracker from "@/components/CalorieTracker"
import DatePicker from "@/components/DatePicker"
import MacroProgress from "@/components/MacroProgress"
import { useDailyLogStore, useUserStore } from "@/stores"
import { useCallback, useEffect } from "react"
import { View } from "react-native"
import { useHeaderHeight } from "@react-navigation/elements"

export default function HomeScreen() {
    const headerHeight = useHeaderHeight()

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

    return (
        <View className="flex-1 pt-safe" style={{ paddingTop: headerHeight }}>
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
        </View>
    )
}
