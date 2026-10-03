import { sanityClient } from "./client";

// ─── TypeScript types ──────────────────────────────────────────────────────────

export interface SanityImageRef {
  _type: "image";
  asset: {
    _ref: string;
    _type: "reference";
  };
  hotspot?: { x: number; y: number; height: number; width: number };
  crop?: { top: number; bottom: number; left: number; right: number };
}

// ── Home Page ──────────────────────────────────────────────────────────────────
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
  heroBackground: SanityImageRef | null;
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
  navbarIemLogo?: SanityImageRef | null;
  navbarIedcLogo?: SanityImageRef | null;
  navbarUemLogo?: SanityImageRef | null;
  navbarLinks?: NavLinkData[] | null;
}

export async function getHomePageData(): Promise<HomePageData | null> {
  try {
    return await sanityClient.fetch<HomePageData | null>(
      `*[_type == "homePage" && _id == "homePage"][0]{
        heroBackground,
        heroTagline,
        heroMissionBlurb,
        aboutEyebrow,
        aboutHeading,
        aboutBody,
        aboutCtaLabel,
        stats[] {
          value,
          suffix,
          prefix,
          label,
          sub
        },
        marqueeSubtitle,
        marqueeTitle,
        marqueeStats[] {
          value,
          label,
          icon
        },
        footerWordmark,
        footerAbout,
        footerSocials[] {
          platform,
          url
        },
        footerLinks[] {
          label,
          href
        },
        navbarIemLogo,
        navbarIedcLogo,
        navbarUemLogo,
        navbarLinks[] {
          label,
          href
        }
      }`,
      {},
      { next: { revalidate: 60 } }
    );
  } catch (err) {
    console.warn("[Sanity] getHomePageData failed:", (err as Error).message);
    return null;
  }
}

// ── Journey Milestones ─────────────────────────────────────────────────────────
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

export async function getMilestones(): Promise<MilestoneData[]> {
  try {
    return await sanityClient.fetch<MilestoneData[]>(
      `*[_type == "milestone"] | order(orderRank asc){
        _id,
        year,
        tag,
        title,
        description,
        details,
        iconName,
        orderRank
      }`,
      {},
      { next: { revalidate: 60 } }
    );
  } catch (err) {
    console.warn("[Sanity] getMilestones failed:", (err as Error).message);
    return [];
  }
}

// ── Research Gallery Slides ────────────────────────────────────────────────────
export interface GallerySlideData {
  _id: string;
  label: string;
  category: string;
  description: string;
  year: string;
  accentColor: string;
  image: SanityImageRef;
  orderRank: number;
}

export async function getGallerySlides(): Promise<GallerySlideData[]> {
  try {
    return await sanityClient.fetch<GallerySlideData[]>(
      `*[_type == "gallerySlide"] | order(orderRank asc){
        _id,
        label,
        category,
        description,
        year,
        accentColor,
        image,
        orderRank
      }`,
      {},
      { next: { revalidate: 60 } }
    );
  } catch (err) {
    console.warn("[Sanity] getGallerySlides failed:", (err as Error).message);
    return [];
  }
}

// ── Contact Page ───────────────────────────────────────────────────────────────
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

export async function getContactPageData(): Promise<ContactPageData | null> {
  try {
    return await sanityClient.fetch<ContactPageData | null>(
      `*[_type == "contactPage" && _id == "contactPage"][0]{
        pageDescription,
        connectDescription,
        location,
        emails,
        phones[] {
          label,
          number
        },
        workingHours
      }`,
      {},
      { next: { revalidate: 60 } }
    );
  } catch (err) {
    console.warn("[Sanity] getContactPageData failed:", (err as Error).message);
    return null;
  }
}

// ── Team Page Content ──────────────────────────────────────────────────────────
export interface TeamPageContent {
  eyebrow: string;
  heading: string;
  description: string;
}

export async function getTeamPageContent(): Promise<TeamPageContent | null> {
  try {
    return await sanityClient.fetch<TeamPageContent | null>(
      `*[_type == "teamPage" && _id == "teamPage"][0]{
        eyebrow,
        heading,
        description
      }`,
      {},
      { next: { revalidate: 60 } }
    );
  } catch (err) {
    console.warn("[Sanity] getTeamPageContent failed:", (err as Error).message);
    return null;
  }
}

// ── Team Members (Students) ────────────────────────────────────────────────────
export interface SanityTeamMember {
  _id: string;
  name: string;
  designation: string | null;
  department: string | null;
  areasOfExpertise: string[];
  photo: SanityImageRef | null;
  email: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  orderRank: number;
}

export async function getSanityTeamMembers(): Promise<SanityTeamMember[]> {
  try {
    return await sanityClient.fetch<SanityTeamMember[]>(
      `*[_type == "teamMember"] | order(orderRank asc){
        _id,
        name,
        designation,
        department,
        areasOfExpertise,
        photo,
        email,
        linkedinUrl,
        githubUrl,
        orderRank
      }`,
      {},
      { next: { revalidate: 60 } }
    );
  } catch (err) {
    console.warn("[Sanity] getSanityTeamMembers failed:", (err as Error).message);
    return [];
  }
}
