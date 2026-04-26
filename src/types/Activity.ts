export type ActivityCategory = 'Engineering' | 'Health';

export type Activity = {
  id: string;
  title: string;
  category: ActivityCategory;
  domain: string;
  shortDescription: string;
  comingSoon: boolean;
};
