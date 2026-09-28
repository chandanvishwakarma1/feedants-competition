import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { getCompetition, registerForCompetition, submitEntry } from "../api/competitionApi";

export function useCompetition(competitionId) {
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCompetition = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const data = await getCompetition(competitionId);
        setCompetition(data);
      } catch (err) {
        setError(err.message || "Failed to load competition.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [competitionId]
  );

  useEffect(() => {
    fetchCompetition();
  }, [fetchCompetition]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCompetition({ silent: true });
    setRefreshing(false);
  }, [fetchCompetition]);

  const handleRegister = useCallback(async () => {
    setActionLoading(true);
    try {
      const res = await registerForCompetition(competitionId);
      setCompetition(res.competition);
      Alert.alert("Registered!", "You're all set. Good luck!");
    } catch (err) {
      Alert.alert("Couldn't register", err.message || "Something went wrong.");
      await fetchCompetition({ silent: true });
    } finally {
      setActionLoading(false);
    }
  }, [competitionId, fetchCompetition]);

  const handleSubmitEntry = useCallback(
    async ({ mediaUrl, caption }) => {
      setActionLoading(true);
      try {
        const res = await submitEntry(competitionId, { mediaUrl, caption });
        setCompetition(res.competition);
        Alert.alert("Submitted!", "Your entry has been uploaded.");
      } catch (err) {
        Alert.alert("Couldn't submit", err.message || "Something went wrong.");
      } finally {
        setActionLoading(false);
      }
    },
    [competitionId]
  );

  return {
    competition,
    loading,
    refreshing,
    error,
    actionLoading,
    onRefresh,
    handleRegister,
    handleSubmitEntry,
    refetch: fetchCompetition,
  };
}
