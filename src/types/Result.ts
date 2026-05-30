export type Result = {
  id: string;
  activityId: string;
  teamName: string;
  members: string[];
  result: number | string;
  timestamp: number;
  rating?: number;
  comment?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  locationName?: string;
  images?: Array<{ uri: string; label?: string }>;
};
