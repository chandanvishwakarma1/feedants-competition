import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { colors } from "../theme/colors";
import { ChevronDown, ChevronUp } from "lucide-react-native";

const TABS = [
  { key: "about", label: "About Competition" },
  { key: "judging", label: "Judging Parameters" },
  { key: "rules", label: "Rules & Eligibility" },
];

export default function TabsSection({ aboutText, judgingParameters, rulesAndEligibility }) {
  const [active, setActive] = useState("about");
  const [expanded, setExpanded] = useState(false);

  const content = { about: aboutText, judging: judgingParameters, rules: rulesAndEligibility }[active] || "";
  const isLong = content.length > 140;
  const displayText = !expanded && isLong ? content.slice(0, 140).trimEnd() + "…" : content;

  return (
    <View style={styles.card}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.tabRow, { overflow: 'hidden' }]}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => {
              setActive(tab.key);
              setExpanded(false);
            }}
            style={styles.tabButton}
          >
            <Text style={[styles.tabLabel, active === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
            {active === tab.key && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.body}>{displayText || "No details provided."}</Text>

      {isLong && (
        <TouchableOpacity onPress={() => setExpanded((e) => !e)} style={styles.viewMoreContainer}>
          <Text style={styles.viewMoreText}>{expanded ? "View less" : "View more"}</Text>
          {expanded ? <ChevronUp size={24}  color={colors.primary} /> : <ChevronDown size={24} color={colors.primary} />}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.background, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16 },
  tabRow: { gap: 20, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10 },
  tabButton: { alignItems: "center" },
  tabLabel: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  tabLabelActive: { color: colors.primary },
  tabUnderline: { height: 2, backgroundColor: colors.primary, width: "100%", marginTop: 6, borderRadius: 1 },
  body: { fontSize: 13, color: colors.text, lineHeight: 20, marginTop: 14 },
  viewMoreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
    color: colors.primary
  },
  viewMoreText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "700"
  },
});
