import HomeClient from "@/components/home/HomeClient";
import {
  getHomePageData,
  getMilestones,
  getGallerySlides,
} from "../../sanity/lib/queries";

export default async function Home() {
  // Fetch all home page content from Sanity in parallel
  const [homePageData, milestones, gallerySlides] = await Promise.all([
    getHomePageData(),
    getMilestones(),
    getGallerySlides(),
  ]);

  return (
    <HomeClient
      homePageData={homePageData}
      milestones={milestones}
      gallerySlides={gallerySlides}
    />
  );
}
