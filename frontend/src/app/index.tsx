import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { Redirect } from "expo-router";
import { listCompetitions } from "../api/competitionApi";
import { colors } from "../theme/colors";

export default function Index() {
  const [targetId, setTargetId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
  let cancelled = false;
  (async () => {
    try {
      setLoading(true);
      setError(null);
      const competitions = await listCompetitions();
      if (!cancelled && competitions?.length) setTargetId(competitions[0].id);
      else if (!cancelled) setError("No competitions found.");
    } catch (err) {
      if (!cancelled) setError(err.message || "Could not reach the backend.");
    } finally {
      if (!cancelled) setLoading(false);
    }
  })();
  return () => { cancelled = true; };
}, [retryKey]);

  if (targetId) {
    return <Redirect href={`/competition/${targetId}`} />;
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.centered}>
      <Text style={styles.errorText}>{error}</Text>
      <Text style={styles.hint}>
        Check API_BASE_URL in src/api/client.js and that the backend is running.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => setRetryKey((k) => k + 1)}>
        <Text style={styles.retryText}>Retry {retryKey}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 10 },
  errorText: { color: colors.danger, textAlign: "center", fontWeight: "600" },
  hint: { color: colors.textMuted, textAlign: "center", fontSize: 12 },
});
