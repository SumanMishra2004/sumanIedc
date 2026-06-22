import HomeClient from "@/components/home/HomeClient";
import {
  getHomePageData,
  getMilestones,
  getGallerySlides,
  getContactPageData,
} from "../../sanity/lib/queries";

export default async function Home() {
  // Fetch all home page content from Sanity in parallel
  const [homePageData, milestones, gallerySlides, contactPageData] = await Promise.all([
    getHomePageData(),
    getMilestones(),
    getGallerySlides(),
    getContactPageData(),
  ]);

  return (
    <HomeClient
      homePageData={homePageData}
      milestones={milestones}
      gallerySlides={gallerySlides}
      contactPageData={contactPageData}
    />
  );
}
