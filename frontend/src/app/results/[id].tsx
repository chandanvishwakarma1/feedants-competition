import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { colors } from "../../theme/colors";

/**
 * Placeholder results screen - would fetch and display final standings
 * for the competition once phase === "results_declared".
 */
export default function Results() {
  const { id } = useLocalSearchParams();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Results for competition {id} go here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, padding: 24 },
  text: { color: colors.textMuted, textAlign: "center" },
});
