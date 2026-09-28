import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { Check, Trophy, Users } from 'lucide-react-native'

export default function InfoCard({ competition }) {
  const { title, tags = [], certificateForWinners, prizePool, entryFee, totalSpots, spotsLeft, isRegistered } =
    competition;

  const spotsRatio = totalSpots > 0 ? 1 - spotsLeft / totalSpots : 0;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        {isRegistered && (
          <View style={[styles.badge, {flexDirection: 'row'}]}>
            <Check size={16} color={colors.primary} />
            <Text style={styles.badgeText}>Registered</Text>
          </View>
        )}
      </View>

      <View style={styles.tagsRow}>
        {tags.map((tag) => (
          <View key={tag} style={styles.tagChip}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
        {certificateForWinners && (
          <>
            <Trophy size={12} color={colors.primary} />
            <Text style={styles.certText}>Winners get certificate</Text>
          </>
        )}
      </View>

      <View style={styles.statsRow}>
        <View>
          <Text style={styles.statLabel}>Prize Pool</Text>
          <Text style={styles.statValue}>₹ {prizePool}</Text>
        </View>
        <View>
          <Text style={styles.statLabel}>Entry Fee</Text>
          <Text style={styles.statValue}>₹ {entryFee}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <View style={{ flex: 1, flexDirection: 'row', gap:2, alignItems: 'center'}}>
            <Users size={12} color={colors.primary} style={{marginBottom:4}} />
            <Text style={styles.spotsLabel}>
              {spotsLeft > 0 ? `Only ${spotsLeft} spots left` : "Fully booked"}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(spotsRatio * 100, 100)}%` }]} />
          </View>
          <Text style={styles.bookedText}>
            {totalSpots - spotsLeft} / {totalSpots} Booked
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 20, fontWeight: "700", color: colors.text, flex: 1, marginRight: 8 },
  badge: { backgroundColor: colors.primaryLight, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
  tagsRow: { flexDirection: "row", alignItems: "center", marginTop: 10, flexWrap: "wrap", gap: 8 },
  tagChip: { backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  tagText: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  certText: { fontSize: 12, color: colors.primary, fontWeight: "600" },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 18 },
  statLabel: { fontSize: 12, color: colors.textMuted },
  statValue: { fontSize: 18, fontWeight: "700", color: colors.primary, marginTop: 2 },
  spotsLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  progressTrack: { width: '100%', height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: "hidden" },
  progressFill: { height: 4, backgroundColor: colors.primary },
  bookedText: { fontSize: 11, color: colors.textMuted, marginTop: 3 },
});
