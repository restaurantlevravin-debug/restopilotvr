import { Stack } from "expo-router";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router";
import { useColorScheme } from "react-native";

import { PersonnelProvider } from "@/context/PersonnelContext";
import { EntrepriseProvider } from "@/context/EntrepriseContext";
import { UserProvider } from "@/context/UserContext";
import { ValidationProvider } from "@/context/ValidationContext";
import { HaccpProvider } from "@/context/HaccpContext";
import { RewardProvider } from "@/context/RewardContext";
import { ClotureJourneeProvider } from "@/context/ClotureJourneeContext";
import { AnomalieHaccpProvider } from "@/context/AnomalieHaccpContext";


export default function RootLayout() {

  const colorScheme = useColorScheme();


  return (

    <PersonnelProvider>

      <EntrepriseProvider>

        <UserProvider>

          <ValidationProvider>

            <ClotureJourneeProvider>

              <RewardProvider>

              <HaccpProvider>

                <AnomalieHaccpProvider>

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

                </AnomalieHaccpProvider>

              </HaccpProvider>

              </RewardProvider>

            </ClotureJourneeProvider>

          </ValidationProvider>

        </UserProvider>

      </EntrepriseProvider>

    </PersonnelProvider>

  );

}
