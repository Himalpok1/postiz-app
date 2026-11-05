export interface PricingInnerInterface {
  current: string;
  month_price: number;
  year_price: number;
  channel?: number;
  posts_per_month: number;
  team_members: boolean;
  community_features: boolean;
  featured_by_gitroom: boolean;
  ai: boolean;
  import_from_channels: boolean;
  image_generator?: boolean;
  image_generation_count: number;
  generate_videos: number;
  clipping_minutes: number;
  public_api: boolean;
  webhooks: number;
  autoPost: boolean;
  storage_gb: number;
  // Per social provider (keyed by its identifier), checked generically around
  // publishing. A provider that isn't listed has no publishing limit.
  publish_limits: Record<string, PublishLimit>;
}
export interface PublishLimit {
  label: string;
  period: 'month' | 'day';
  posts: number;
  link_posts?: number;
}
export interface PricingInterface {
  [key: string]: PricingInnerInterface;
}
const publishLimits = (
  xPosts: number,
  xLinkPosts: number,
  youtubeUploads: number
): Record<string, PublishLimit> => ({
  x: { label: 'X', period: 'month', posts: xPosts, link_posts: xLinkPosts },
  youtube: { label: 'YouTube', period: 'day', posts: youtubeUploads },
});
// Bought per X account on top of any plan. X charges for every post read, so
// each account's posts are read on a schedule, up to this many a month.
export const xAnalyticsAddon = {
  month_price: 5,
  tracked_posts_per_month: 300,
};
export const planDisplayName: Record<string, string> = {
  FREE: 'Free',
  STANDARD: 'Starter',
  TEAM: 'Team',
  PRO: 'Pro',
  ULTIMATE: 'Scale',
};
export const pricing: PricingInterface = {
  FREE: {
    current: 'FREE',
    month_price: 0,
    year_price: 0,
    channel: 0,
    image_generation_count: 0,
    posts_per_month: 0,
    team_members: false,
    community_features: false,
    featured_by_gitroom: false,
    ai: false,
    import_from_channels: false,
    image_generator: false,
    public_api: false,
    webhooks: 0,
    autoPost: false,
    generate_videos: 0,
    clipping_minutes: 0,
    storage_gb: 0,
    publish_limits: publishLimits(0, 0, 0),
  },
  STANDARD: {
    current: 'STANDARD',
    month_price: 19,
    year_price: 190,
    channel: 5,
    posts_per_month: 1000000,
    image_generation_count: 0,
    team_members: false,
    ai: false,
    community_features: false,
    featured_by_gitroom: false,
    import_from_channels: true,
    image_generator: false,
    public_api: true,
    webhooks: 2,
    autoPost: false,
    generate_videos: 0,
    clipping_minutes: 0,
    storage_gb: 10,
    publish_limits: publishLimits(300, 10, 3),
  },
  TEAM: {
    current: 'TEAM',
    month_price: 29,
    year_price: 290,
    channel: 10,
    posts_per_month: 1000000,
    image_generation_count: 0,
    community_features: true,
    team_members: true,
    featured_by_gitroom: true,
    ai: false,
    import_from_channels: true,
    image_generator: false,
    public_api: true,
    webhooks: 10,
    autoPost: true,
    generate_videos: 0,
    clipping_minutes: 0,
    storage_gb: 25,
    publish_limits: publishLimits(500, 20, 5),
  },
  PRO: {
    current: 'PRO',
    month_price: 39,
    year_price: 390,
    channel: 30,
    posts_per_month: 1000000,
    image_generation_count: 0,
    community_features: true,
    team_members: true,
    featured_by_gitroom: true,
    ai: false,
    import_from_channels: true,
    image_generator: false,
    public_api: true,
    webhooks: 30,
    autoPost: true,
    generate_videos: 0,
    clipping_minutes: 0,
    storage_gb: 50,
    publish_limits: publishLimits(750, 30, 10),
  },
  ULTIMATE: {
    current: 'ULTIMATE',
    month_price: 79,
    year_price: 790,
    channel: 100,
    posts_per_month: 1000000,
    image_generation_count: 0,
    community_features: true,
    team_members: true,
    featured_by_gitroom: true,
    ai: false,
    import_from_channels: true,
    image_generator: false,
    public_api: true,
    webhooks: 10000,
    autoPost: true,
    generate_videos: 0,
    clipping_minutes: 0,
    storage_gb: 200,
    publish_limits: publishLimits(1500, 60, 25),
  },
};
