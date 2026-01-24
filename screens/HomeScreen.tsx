import CalorieTracker from "@/components/CalorieTracker"
import { View } from "react-native"
import { useHeaderHeight } from "@react-navigation/elements"

// Fake data for demonstration
const FAKE_DATA = {
    eaten: 1824,
    target: 2500,
}

export default function HomeScreen() {
    const headerHeight = useHeaderHeight()

    return (
        <View className="flex-1 pt-safe bg-background" style={{ paddingTop: headerHeight }}>
            <CalorieTracker eaten={FAKE_DATA.eaten} target={FAKE_DATA.target} />
        </View>
    )
}
