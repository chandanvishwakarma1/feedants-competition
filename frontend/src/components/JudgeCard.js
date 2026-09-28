import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { colors } from "../theme/colors";
import { CirclePlay, Play } from "lucide-react-native";

export default function JudgeCard({ judge }) {
  if (!judge) return null;

  return (
    <View style={styles.card}>
      <Image source={{ uri: judge.avatarUrl }} style={styles.avatar} />
      <View style={{ flex: 1 }}>
        <Text style={styles.role}>{judge.title || "Judge"}</Text>
        <Text style={styles.name}>{judge.name}</Text>
        {!!judge.intro && <Text style={{fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{judge.intro}</Text>}
        {!!judge.experience && <Text style={styles.meta}>{judge.experience}</Text>}
      </View>
      {!!judge.introVideoUrl && (
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => Linking.openURL(judge.introVideoUrl)}
          accessibilityLabel="Play judge intro video"
        > 
        <View style={{backgroundColor: colors.surface, padding: 16, borderRadius: 100}}>
          <Play size={16}  fill={colors.primary} strokeWidth={0}/>
        </View>
          <Text style={styles.playLabel}>Intro Video</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surface },
  role: { fontSize: 12, color: colors.textMuted },
  name: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 2 },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  playButton: { alignItems: "center", justifyContent: "center" },
  playIcon: { fontSize: 20, color: colors.primary },
  playLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
});
