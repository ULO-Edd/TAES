import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { PaperProvider } from "react-native-paper";
import { en, registerTranslation } from "react-native-paper-dates";
import "react-native-reanimated";
import "react-native-url-polyfill/auto";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { Stack } from "expo-router";

registerTranslation("en", en);

export default function InitialLayout() {
    const colorScheme = useColorScheme();

    // The layout is returned here
    return (
        <PaperProvider>
            <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
                <Stack>
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="game" options={{ headerShown: false }} />
                </Stack>
                <StatusBar style="auto" />
            </ThemeProvider>
        </PaperProvider>
    );
}
