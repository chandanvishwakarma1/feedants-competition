import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { login, register } from "../api/authApi";
import { setToken } from "../api/client";
import { colors } from "../theme/colors";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function validate({ name, email, password, isRegister }) {
  if (isRegister && !name.trim()) return "Name is required.";
  if (isRegister && name.trim().length < 2) return "Name must be at least 2 characters.";
  if (!email.trim()) return "Email is required.";
  if (!EMAIL_REGEX.test(email.trim())) return "Enter a valid email address.";
  if (!password) return "Password is required.";
  if (password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  return null;
}

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isRegister = mode === "register";

  const handleSubmit = async () => {
    setError(null);

    const validationError = validate({ name, email, password, isRegister });
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = isRegister
        ? await register(name.trim(), email.trim(), password)
        : await login(email.trim(), password);

      await setToken(res.token);

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/");
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>{isRegister ? "Create account" : "Welcome back"}</Text>
      <Text style={styles.subtitle}>
        {isRegister ? "Sign up to register for competitions." : "Log in to continue."}
      </Text>

      {isRegister && (
        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.textMuted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {isRegister && <Text style={styles.hint}>At least 8 characters.</Text>}

      {!!error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.submitText}>{isRegister ? "Sign up" : "Log in"}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          setError(null);
          setMode(isRegister ? "login" : "register");
        }}
      >
        <Text style={styles.switchText}>
          {isRegister ? "Already have an account? Log in" : "New here? Create an account"}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4, marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    marginBottom: 12,
  },
  hint: { color: colors.textMuted, fontSize: 12, marginBottom: 8 },
  error: { color: colors.danger, fontSize: 13, marginBottom: 8 },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
  },
  submitText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  switchText: { color: colors.primary, textAlign: "center", marginTop: 18, fontSize: 13, fontWeight: "600" },
});