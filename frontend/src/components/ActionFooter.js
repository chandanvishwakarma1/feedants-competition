import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { colors } from "../theme/colors";



export default function ActionFooter({
  cta,
  loading = false,
  onRegister,
  onUpload,
  onLogin,
  onViewResults,
}) {
  if (!cta) return null;

  const handlePress = () => {
    if (!cta.enabled || loading) return;
    switch (cta.action) {
      case "register":
        return onRegister?.();
      case "upload":
        return onUpload?.();
      case "login":
        return onLogin?.();
      case "view_results":
        return onViewResults?.();
      default:
        return;
    }
  };

  const isPrimaryActionable = cta.enabled && cta.action !== "none";

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[
          styles.button,
          isPrimaryActionable ? styles.buttonActive : styles.buttonDisabled,
          !isPrimaryActionable && styles.noPointer,
        ]}
        disabled={!cta.enabled || loading}
        onPress={handlePress}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={[styles.buttonText, !isPrimaryActionable && styles.buttonTextDisabled]}>
            {cta.label}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { padding: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background },
  button: { borderRadius: 12, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  buttonActive: { backgroundColor: colors.primary },
  buttonDisabled: { backgroundColor: colors.surface },
  buttonText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  buttonTextDisabled: { color: colors.textMuted },
});
