import CalorieTracker from "@/components/CalorieTracker"
import { useDailyLogStore, useUserStore } from "@/stores"
import { useEffect } from "react"
import { View } from "react-native"
import { useHeaderHeight } from "@react-navigation/elements"

export default function HomeScreen() {
    const headerHeight = useHeaderHeight()

    // Subscribe to specific values from stores (this ensures re-renders)
    const calories = useDailyLogStore(state => state.log.totals.calories)
    const loadDailyLog = useDailyLogStore(state => state.load)
    const targetCalories = useUserStore(state => state.goals.calories)
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

    return (
        <View className="flex-1 pt-safe bg-background" style={{ paddingTop: headerHeight }}>
            <CalorieTracker
                eaten={calories}
                target={targetCalories}
            />
        </View>
    )
}
