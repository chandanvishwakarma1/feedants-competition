import React, { useCallback } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useCompetition } from "../hooks/useCompetition";
import { colors } from "../theme/colors";

import InfoCard from "../components/InfoCard";
import JudgeCard from "../components/JudgeCard";
import CountdownTimer from "../components/CountdownTimer";
import ImportantDates from "../components/ImportantDates";
import PreviousWinners from "../components/PreviousWinners";
import TabsSection from "../components/TabsSection";
import RewardsTable from "../components/RewardsTable";
import ActionFooter from "../components/ActionFooter";
import PostDisclaimerSection from "../components/PostDisclaimerSection";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { clearToken } from "../api/client";

const COUNTDOWN_LABEL_BY_PHASE = {
  upcoming: "Registration closes in",
  registration_closed: "Submissions open in",
  submission_open: "Submissions close in",
  judging: "Results in",
};


export default function CompetitionDetailsScreen({ competitionId, router }) {
  const insets = useSafeAreaInsets();
  const {
    competition,
    loading,
    refreshing,
    error,
    actionLoading,
    onRefresh,
    handleRegister,
    handleSubmitEntry,
    refetch,
  } = useCompetition(competitionId)

  const isFirstFocus = React.useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      refetch({ silent: true });
    }, [refetch])
  );
  const handleLogout = async () => {
    await clearToken();
    await refetch({ silent: true }); // re-fetch as an anonymous viewer
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !competition) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || "Something went wrong."}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentPhase = competition?.phase;
  const countdownLabel = currentPhase ? COUNTDOWN_LABEL_BY_PHASE[currentPhase] : undefined;
  const previousWinners = (competition.previousWinners ?? [])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router?.canGoBack?.() ? router.back() : router?.replace?.("/"))}>
          <Text style={styles.backText}>← Go back</Text>
        </TouchableOpacity>
        {competition.userState !== "anonymous" && (
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <InfoCard competition={competition} />
        <JudgeCard judge={competition.judge} />

        {countdownLabel && competition.countdownTargetIso && (
          <CountdownTimer
            targetIso={competition.countdownTargetIso}
            serverTimeIso={competition.serverTime}
            label={countdownLabel}
          />
        )}

        <ImportantDates dates={competition.dates} />
        <PreviousWinners winners={previousWinners} />
        <TabsSection
          aboutText={competition.aboutText}
          judgingParameters={competition.judgingParameters}
          rulesAndEligibility={competition.rulesAndEligibility}
        />
        <RewardsTable rewards={competition.rewards} disclaimer={competition.disclaimer} />
        <PostDisclaimerSection competition={competition} />
      </ScrollView>

      <ActionFooter
        cta={competition.cta}
        loading={actionLoading}
        onRegister={handleRegister}
        onUpload={() =>
          // In production this opens a media picker, uploads to storage,
          // then calls handleSubmitEntry({ mediaUrl, caption }) with the resulting URL.
          handleSubmitEntry({ mediaUrl: "https://example.com/uploads/demo.mp4", caption: "" })
        }
        onLogin={() => router?.push?.("/login")}
        onViewResults={() => router?.push?.(`/results/${competitionId}`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    // backgroundColor: colors.background,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoutText: { fontSize: 13, fontWeight: "600", color: colors.primary },
  backText: { fontSize: 15, fontWeight: "600", color: colors.text },
  scrollContent: { padding: 16, gap: 14 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  errorText: { color: colors.danger, textAlign: "center" },
  retryButton: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: colors.white, fontWeight: "700" },
});