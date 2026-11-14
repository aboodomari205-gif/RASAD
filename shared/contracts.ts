import type { Availability, CoverageDay, Dataset, Diagnostics, Observation, ObservationFilter, Period, SCHEMA_VERSION } from './model.ts';
import type { aggregatePeriods, sensorSummaries } from './observations.ts';
import type { SensorComparison } from './harmonization.ts';
export type IntelligenceResource = 'datasets' | 'observations' | 'aggregates' | 'coverage' | 'comparison';
export type IntelligenceCapabilities = { temporalAggregation: boolean; validatedBaseline: false; sensorNormalizedComparison: false; normalizedAnomalies: false; decisionBrief: 'descriptive-only' };
export type IntelligenceBase = {
  schemaVersion: typeof SCHEMA_VERSION; scope: ObservationFilter; availability: Availability;
  datasets: Dataset[]; diagnostics: Diagnostics; ingestionReports: unknown[];
  coverage: CoverageDay[]; caveats: string[]; capabilities: IntelligenceCapabilities;
};
export type IntelligenceResponse =
  | (IntelligenceBase & { resource: 'datasets' })
  | (IntelligenceBase & { resource: 'observations'; observations: Observation[]; sensorSummaries: ReturnType<typeof sensorSummaries> })
  | (IntelligenceBase & { resource: 'aggregates'; period: Period; series: ReturnType<typeof aggregatePeriods> })
  | (IntelligenceBase & { resource: 'coverage'; coverageStatus: 'unknown'; evidence: string; datasetCoverage: { datasetId: string; sensor: string; platform: string | null; status: 'unknown'; verifiedDays: never[] }[] })
  | (IntelligenceBase & { resource: 'comparison'; comparison: SensorComparison });
export type IntelligenceErrorResponse = { schemaVersion: typeof SCHEMA_VERSION; resource?: IntelligenceResource; scope?: ObservationFilter; availability: Availability; error: { code: 'INVALID_QUERY' | 'DATASET_NOT_FOUND' | 'DATA_UNAVAILABLE' | 'QUERY_TOO_LARGE'; message: string } };
