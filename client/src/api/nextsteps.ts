import apiClient from "./client";
import type { NextStepRecommendation } from "../types/nextsteps";

export const getNextSteps = async (): Promise<NextStepRecommendation[]> => {
  const res = await apiClient.get("/next-steps");
  return res.data;
};
