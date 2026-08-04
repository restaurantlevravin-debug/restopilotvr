import { Stack } from "expo-router";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router";
import { useColorScheme } from "react-native";

import { PersonnelProvider } from "@/context/PersonnelContext";
import { HaccpProvider } from "@/context/HaccpContext";


export default function RootLayout() {

  const colorScheme = useColorScheme();


  return (

    <PersonnelProvider>

      <HaccpProvider>

      <ThemeProvider
        value={
          colorScheme === "dark"
            ? DarkTheme
            : DefaultTheme
        }
      >

        <Stack
          screenOptions={{
            headerShown:false,
          }}
        />

      </ThemeProvider>

      </HaccpProvider>

    </PersonnelProvider>

  );

}
