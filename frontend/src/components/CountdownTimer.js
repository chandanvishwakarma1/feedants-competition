import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";



export default function CountdownTimer({ targetIso, serverTimeIso, label = "Registration closes in" }) {
  const [now, setNow] = useState(() => new Date());
  const [offsetMs] = useState(() => {
    if (!serverTimeIso) return 0;
    return new Date(serverTimeIso).getTime() - Date.now();
  });

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!targetIso) return null;

  const correctedNow = now.getTime() + offsetMs;
  const diff = new Date(targetIso).getTime() - correctedNow;

  if (diff <= 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Time's up</Text>
      </View>
    );
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, "0");

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.time}>
        {pad(days)}d : {pad(hours)}h : {pad(minutes)}m : {pad(seconds)}s
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: { color: colors.primary, fontSize: 13, fontWeight: "600" },
  time: { color: colors.primary, fontSize: 15, fontWeight: "700" },
});
