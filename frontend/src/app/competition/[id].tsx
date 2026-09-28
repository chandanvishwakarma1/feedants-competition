import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import CompetitionDetailsScreen from "../../screens/CompetitionDetailsScreen";

export default function CompetitionRoute() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return <CompetitionDetailsScreen competitionId={id} router={router} />;
}
