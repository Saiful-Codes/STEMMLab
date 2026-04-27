export type Result = {
  id: string;
  activityId: string;
  teamName: string;
  members: string[];
  result: number | string;
  timestamp: number;
  rating?: number;
  comment?: string;
};
