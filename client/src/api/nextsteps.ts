import apiClient from './client';
import type { NextStepRecommendation } from '../types/nextsteps';

export async function getNextSteps(): Promise<NextStepRecommendation[]> {
  const res = await apiClient.get('/next-steps');
  return res.data;
}
