export type ChartType = "pie" | "bar" | "line";
export type Aggregation = "sum" | "count" | "avg";

export type EmbedConfig = {
  userId: string;
  db: string;
  chart: ChartType;
  groupBy: string;
  valueProp?: string;
  agg?: Aggregation;
  filters?: Record<string, string[]>;
  title?: string;
};

export type NormalizedRow = {
  id: string;
  Value: number | null;
  "Date Start": string | null;
  "Date End": string | null;
  Type: string | null;
  Category: string | null;
  Name: string | null;
  "Notion Url": string | null;
  [key: string]: string | number | null;
};

export type AggregatedPoint = {
  label: string;
  value: number;
};
