import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

const MEDAL_ICON = { 1: "🏆", 2: "🥈", 3: "🥉" };

export default function RewardsTable({ rewards = [], disclaimer }) {
  if (!rewards.length) return null;
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Rewards <Text style={styles.subtitle}>(All Positions)</Text></Text>

      {rewards.map((r) => (
        <View key={r.position} style={styles.row}>
          <View style={styles.left}>
            <Text style={styles.icon}>{MEDAL_ICON[r.position] || "⭐"}</Text>
            <Text style={styles.label}>{r.label}</Text>
          </View>
          <Text style={styles.amount}>₹ {r.amount}</Text>
        </View>
      ))}

      {!!disclaimer && (
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>ⓘ Disclaimer: {disclaimer}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.background, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16 },
  title: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 10 },
  subtitle: { fontSize: 12, fontWeight: "400", color: colors.textMuted },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 8 },
  icon: { fontSize: 14 },
  label: { fontSize: 13, color: colors.text, fontWeight: "600" },
  amount: { fontSize: 13, color: colors.primary, fontWeight: "700" },
  disclaimerBox: { backgroundColor: colors.primaryLight, borderRadius: 10, padding: 10, marginTop: 12 },
  disclaimerText: { fontSize: 11, color: colors.primary },
});
