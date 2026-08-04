import {
  TabList,
  TabListProps,
  Tabs,
  TabSlot,
  TabTrigger,
} from "expo-router/ui";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot />

      <TabList asChild>
        <CustomTabList>

          <TabTrigger name="home" href="/" asChild>
            <Pressable style={styles.button}>
              <Text style={styles.text}>Accueil</Text>
            </Pressable>
          </TabTrigger>

          <TabTrigger name="personnel" href="/personnel" asChild>
            <Pressable style={styles.button}>
              <Text style={styles.text}>Personnel</Text>
            </Pressable>
          </TabTrigger>

        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.container}>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    gap: 10,
    backgroundColor: "#F5F5F5",
  },

  button: {
    backgroundColor: "#00695C",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },

  text: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});