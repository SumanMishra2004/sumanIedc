// ─── Shared content types ─────────────────────────────────────────────────────
// Previously these types lived in sanity/lib/queries.ts and were tightly coupled
// to Sanity's image reference format. They now use plain strings for image URLs.

export interface StatItem {
  value: string;
  suffix?: string;
  prefix?: string;
  label: string;
  sub: string;
}

export interface MarqueeStatItem {
  value: string;
  label: string;
  icon: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface NavLinkData {
  label: string;
  href: string;
}

export interface HomePageData {
  heroBackground: string | null;
  heroTagline: string;
  heroMissionBlurb?: string;
  aboutEyebrow: string;
  aboutHeading: string;
  aboutBody: string;
  aboutCtaLabel: string;
  stats?: StatItem[] | null;
  marqueeSubtitle?: string;
  marqueeTitle?: string;
  marqueeStats?: MarqueeStatItem[] | null;
  footerWordmark?: string[] | null;
  footerAbout?: string;
  footerSocials?: SocialLink[] | null;
  footerLinks?: NavLinkData[] | null;
  navbarIemLogo?: string | null;
  navbarIedcLogo?: string | null;
  navbarUemLogo?: string | null;
  navbarLinks?: NavLinkData[] | null;
}

export interface MilestoneData {
  _id: string;
  year: string;
  tag: string;
  title: string;
  description: string;
  details: string[];
  iconName: string;
  orderRank: number;
}

export interface GallerySlideData {
  _id: string;
  label: string;
  category: string;
  description: string;
  year: string;
  accentColor: string;
  /** Plain URL string, or null to use the built-in fallback images */
  image: string | null;
  orderRank: number;
}

export interface PhoneEntry {
  label: string;
  number: string;
}

export interface ContactPageData {
  pageDescription: string;
  connectDescription: string;
  location: string;
  emails: string[];
  phones: PhoneEntry[];
  workingHours: string;
}

export interface TeamPageContent {
  eyebrow: string;
  heading: string;
  description: string;
}

export interface SanityTeamMember {
  _id: string;
  name: string;
  designation: string | null;
  department: string | null;
  areasOfExpertise: string[];
  /** Plain URL string, or null */
  photo: string | null;
  email: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  orderRank: number;
}
