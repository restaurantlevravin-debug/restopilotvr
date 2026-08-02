import {
  TabList,
  TabListProps,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from "expo-router/ui";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />

      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Accueil</TabButton>
          </TabTrigger>

          <TabTrigger name="personnel" href="/personnel" asChild>
            <TabButton>Personnel</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

function TabButton({
  children,
  isFocused,
  ...props
}: TabTriggerSlotProps) {
  return (
    <Pressable {...props}>
      <View
        style={[
          styles.button,
          isFocused && styles.buttonSelected,
        ]}>
        <Text style={styles.text}>{children}</Text>
      </View>
    </Pressable>
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

  buttonSelected: {
    backgroundColor: "#004D40",
  },

  text: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});