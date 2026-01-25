import { Text } from '@/components/ui/Text'
import { useAuth } from '@/contexts/AuthContext'
import { Pressable, View } from "react-native"
import { createMMKV } from 'react-native-mmkv'

export default function HistoryScreen() {
    const { signOut } = useAuth()

    const handleResetAndLogout = async () => {
        try {
            // Clear all MMKV storage
            const storage = createMMKV({ id: 'supabase-auth' })
            storage.clearAll()

            // Sign out
            await signOut()
        } catch (error) {
            console.error('Failed to reset and logout:', error)
        }
    }

    return (
        <View className="flex-1 pt-safe bg-background justify-center items-center">
            <Text className="text-foreground">History</Text>

            <Pressable
                onPress={handleResetAndLogout}
                className="mt-8 px-6 py-3 bg-red-500 rounded-lg active:opacity-70"
            >
                <Text className="text-white font-medium">Reset Storage & Logout</Text>
            </Pressable>
        </View>
    )
}
