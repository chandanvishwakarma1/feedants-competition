import React from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { colors } from "../theme/colors";
import { Play } from "lucide-react-native";

function ordinal(n) {
  if (n === 1) return "1st Winner";
  if (n === 2) return "2nd Winner";
  if (n === 3) return "3rd Winner";
  return `${n}th Winner`;
}

export default function PreviousWinners({ winners = [] }) {
  if (!winners.length) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Previous Winners</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
        {winners.map((w, idx) => (
          <TouchableOpacity
            key={`${w.name}-${idx}`}
            style={styles.winnerCard}
            onPress={() => w.videoUrl && Linking.openURL(w.videoUrl)}
          >
            <Image source={{ uri: w.imageUrl }} style={styles.winnerImage} />
            {!!w.videoUrl && (
              // <View style={styles.playOverlay}>
              //   <Text style={styles.playIcon}>▶</Text>
              // </View>
              <View style={[styles.playOverlay ,{ backgroundColor: colors.border, padding: 16, borderRadius: 100 }]}>
                <Play size={16} fill={colors.primary} strokeWidth={0} style={{marginLeft:2}} />
              </View>
            )}
            <Text style={styles.winnerName} numberOfLines={1}>{w.name}</Text>
            <Text style={styles.winnerPos}>{ordinal(w.position)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.background, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16 },
  title: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 12 },
  winnerCard: { width: 96 },
  winnerImage: { width: 96, height: 96, borderRadius: 12, backgroundColor: colors.surface },
  playOverlay: {
    position: "absolute",
    bottom: 44,
    right:6,
    alignSelf: "center",
    backgroundColor: "rgba(15,110,94,0.85)",
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: { color: colors.white, fontSize: 12 },
  winnerName: { fontSize: 12, fontWeight: "600", color: colors.text, marginTop: 6 },
  winnerPos: { fontSize: 11, color: colors.primary, fontWeight: "600" },
});
