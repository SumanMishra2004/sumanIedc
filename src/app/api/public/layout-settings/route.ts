import { NextRequest, NextResponse } from "next/server";
import { getHomePageData, getContactPageData } from "../../../../../sanity/lib/queries";
import { urlFor } from "../../../../../sanity/lib/image";

export async function GET(req: NextRequest) {
  try {
    const [homePageData, contactPageData] = await Promise.all([
      getHomePageData(),
      getContactPageData(),
    ]);

    if (!homePageData) {
      return NextResponse.json({ error: "Home page data not found" }, { status: 404 });
    }

    // Process image references into absolute urls if possible
    const iemLogoUrl = homePageData.navbarIemLogo ? urlFor(homePageData.navbarIemLogo).url() : null;
    const iedcLogoUrl = homePageData.navbarIedcLogo ? urlFor(homePageData.navbarIedcLogo).url() : null;
    const uemLogoUrl = homePageData.navbarUemLogo ? urlFor(homePageData.navbarUemLogo).url() : null;

    const navbar = {
      iemLogoUrl,
      iedcLogoUrl,
      uemLogoUrl,
      links: homePageData.navbarLinks || null,
    };

    const footer = {
      wordmark: homePageData.footerWordmark || null,
      about: homePageData.footerAbout || null,
      socials: homePageData.footerSocials || null,
      links: homePageData.footerLinks || null,
      contact: contactPageData ? {
        address: contactPageData.location || null,
        email: contactPageData.emails?.[0] || null,
        phone: contactPageData.phones?.[0]?.number || null,
      } : null,
    };

    return NextResponse.json({ navbar, footer }, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      }
    });
  } catch (error) {
    console.error("Error fetching layout settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
