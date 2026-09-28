import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { CalendarDays, LogOut, Send, Trophy } from "lucide-react-native";

function formatDate(iso) {
  if (!iso) return { dateLine: "-", timeLine: "" };
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = String(d.getFullYear()).slice(-2);
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return { dateLine: `${day} ${month} ${year}`, timeLine: time };
}

// Added customTransform prop to pass down style modifications cleanly
function DateItem({ Icon, label, iso, customTransform }) {
  const { dateLine, timeLine } = formatDate(iso);
  return (
    <View style={styles.item}>
      {/* Icon Wrapper handles dimensions and positional alignment safely */}
      <View style={[styles.iconWrapper, customTransform]}>
        <Icon color={colors.primary} size={20} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.date}>{dateLine}</Text>
        <Text style={styles.time}>{timeLine}</Text>
      </View>
    </View>
  );
}

export default function ImportantDates({ dates }) {
  if (!dates) return null;
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Important Dates</Text>
      <View style={styles.grid}>
        <DateItem Icon={CalendarDays} label="Register Before" iso={dates.registerBefore} />
        <DateItem Icon={Send} label="Submission Starts" iso={dates.submissionStart} />
        <DateItem 
          Icon={LogOut} 
          label="Submission Ends" 
          iso={dates.submissionEnd} 
          customTransform={{ transform: [{ rotate: "-90deg" }] }} // Correct layout rotation array
        />
        <DateItem Icon={Trophy} label="Result Date" iso={dates.resultDate} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.background, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16 },
  title: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 16, columnGap: "4%" }, // Using percentage layout gap for predictable grid
  item: { flexDirection: "row", gap: 12, width: "48%" }, // Increased width slightly to fit 2-column perfectly
  iconWrapper: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  textContainer: { flex: 1 },
  label: { fontSize: 11, color: colors.textMuted },
  date: { fontSize: 13, fontWeight: "700", color: colors.primary, marginTop: 2 },
  time: { fontSize: 12, color: colors.text, fontWeight: "600" },
});
