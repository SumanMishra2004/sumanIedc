import { NextResponse } from "next/server";

// Static layout settings — previously sourced from Sanity CMS.
// Logo images are served from /public. Update these values directly as needed.
const STATIC_NAVBAR = {
  iemLogoUrl: "/iem-logo.png",
  iedcLogoUrl: "/iedc-logo.png",
  uemLogoUrl: "/uem.png",
  links: null, // null = Navbar falls back to its hardcoded ALL_LINKS constant
};

const STATIC_FOOTER = {
  wordmark: null,
  about: null,
  socials: null,
  links: null,
  contact: {
    address: "Innovation Block, Research Park,\nKolkata 700 001, West Bengal, India",
    email: "contact@iedc.edu.in",
    phone: "+91 98765 43210",
  },
};

export async function GET() {
  return NextResponse.json(
    { navbar: STATIC_NAVBAR, footer: STATIC_FOOTER },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=60",
      },
    }
  );
}
