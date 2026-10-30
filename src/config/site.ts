export const siteConfig = {
  name: "CivicFlow",
  tagline: "From Complaints to Action",
  description:
    "Intelligent civic issue resolution platform bridging citizen reports and municipal response through structured AI prioritization and transparent action.",
  url: "https://civicflow.local",
  links: {
    github: "https://github.com/prosofproest/civicflow-Copy.git",
  },
} as const;

export type SiteConfig = typeof siteConfig;
