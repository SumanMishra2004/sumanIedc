import { defineField, defineType } from "sanity";

export const homePage = defineType({
  name: "homePage",
  title: "Home Page",
  type: "document",
  fields: [
    // ── Hero Section ──────────────────────────────────────────────
    defineField({
      name: "heroBackground",
      title: "Hero Background Image",
      type: "image",
      options: { hotspot: true },
      description: "Full-screen background image shown behind the hero heading.",
    }),
    defineField({
      name: "heroHeading",
      title: "Hero Heading",
      type: "string",
      initialValue: "Innovation & Entrepreneurship Development Cell",
    }),
    defineField({
      name: "heroDepartment",
      title: "Hero Department Name",
      type: "string",
      initialValue: "Computer Science and Engineering",
    }),
    defineField({
      name: "heroSpecialisations",
      title: "Specialisation Tags",
      type: "array",
      of: [{ type: "string" }],
      description: "Small pill badges shown under the department name.",
      initialValue: ["Internet of Things", "Cyber Security", "Blockchain Technology"],
    }),
    defineField({
      name: "heroPrimaryCtaLabel",
      title: "Primary CTA Button Label",
      type: "string",
      initialValue: "Explore Programs →",
    }),
    defineField({
      name: "heroSecondaryCtaLabel",
      title: "Secondary CTA Button Label",
      type: "string",
      initialValue: "Meet the Team",
    }),
    defineField({
      name: "heroTagline",
      title: "Tagline (vertical strip & mobile)",
      type: "string",
      initialValue: "Innovate · Build · Disrupt",
    }),

    // ── About Us Section ──────────────────────────────────────────
    defineField({
      name: "aboutEyebrow",
      title: "About — Eyebrow Label",
      type: "string",
      initialValue: "◆ Who We Are ◆",
    }),
    defineField({
      name: "aboutHeading",
      title: "About — Main Heading",
      type: "string",
      initialValue: "Crafting stories that resonate.",
    }),
    defineField({
      name: "aboutBody",
      title: "About — Body Paragraph",
      type: "text",
      rows: 5,
      description: "Animated word-reveal paragraph in the About Us section.",
    }),
    defineField({
      name: "aboutCtaLabel",
      title: "About — Explore Button Label",
      type: "string",
      initialValue: "Explore More",
    }),
    // ── Navbar Section ──────────────────────────────────────────────
    defineField({
      name: "navbarIemLogo",
      title: "Navbar IEM Logo",
      type: "image",
      description: "Institute Logo on the left of the navbar logo strip.",
    }),
    defineField({
      name: "navbarIedcLogo",
      title: "Navbar IEDC Logo",
      type: "image",
      description: "IEDC Logo in the center of the navbar logo strip.",
    }),
    defineField({
      name: "navbarUemLogo",
      title: "Navbar UEM Logo",
      type: "image",
      description: "UEM Partner Logo on the right of the navbar logo strip.",
    }),
    defineField({
      name: "navbarLinks",
      title: "Navbar Navigation Links",
      type: "array",
      of: [
        {
          type: "object",
          name: "navbarNavLink",
          title: "Navbar Link",
          fields: [
            { name: "label", title: "Label", type: "string" },
            { name: "href", title: "Href / Target", type: "string" },
          ],
        },
      ],
      description: "Custom links to show in the navigation bar. If left empty, default links will show.",
    }),

    // ── Stats Strip Section ─────────────────────────────────────────
    defineField({
      name: "stats",
      title: "Statistics List",
      type: "array",
      of: [
        {
          type: "object",
          name: "statItem",
          title: "Stat Item",
          fields: [
            { name: "value", title: "Value (Number)", type: "string" },
            { name: "suffix", title: "Suffix (e.g. + or M+)", type: "string" },
            { name: "prefix", title: "Prefix (e.g. $)", type: "string" },
            { name: "label", title: "Label", type: "string" },
            { name: "sub", title: "Subtext / Description", type: "string" },
          ],
        },
      ],
      description: "List of stats cards rendered below the Hero section (exactly 6 items).",
    }),

    // ── Marquee Section ─────────────────────────────────────────────
    defineField({
      name: "marqueeSubtitle",
      title: "Marquee Subtitle",
      type: "string",
      initialValue: "◆ Innovation and Entrepreneurship Development Cell ◆",
    }),
    defineField({
      name: "marqueeTitle",
      title: "Marquee Title",
      type: "string",
      initialValue: "Numbers That Speak",
    }),
    defineField({
      name: "marqueeStats",
      title: "Marquee Statistics List",
      type: "array",
      of: [
        {
          type: "object",
          name: "marqueeStatItem",
          title: "Marquee Stat Item",
          fields: [
            { name: "value", title: "Value", type: "string" },
            { name: "label", title: "Label", type: "string" },
            { name: "icon", title: "Icon (e.g. ◈, ◉, ◆, ◎)", type: "string" },
          ],
        },
      ],
      description: "List of scrolling stats cards (e.g. 8 items).",
    }),

    // ── Footer Section ──────────────────────────────────────────────
    defineField({
      name: "footerWordmark",
      title: "Footer Wordmark Lines",
      type: "array",
      of: [{ type: "string" }],
      initialValue: ["IEDC", "Research", "Lab"],
      description: "Giant typography lines rendered in the footer.",
    }),
    defineField({
      name: "footerAbout",
      title: "Footer About Description",
      type: "text",
      rows: 3,
      initialValue: "A multidisciplinary research lab at the frontier of computing, AI, and life sciences — shaping tomorrow through rigorous inquiry and bold collaboration.",
    }),
    defineField({
      name: "footerSocials",
      title: "Footer Social Links",
      type: "array",
      of: [
        {
          type: "object",
          name: "socialLink",
          title: "Social Link",
          fields: [
            { name: "platform", title: "Platform (e.g., Twitter, LinkedIn, GitHub, YouTube)", type: "string" },
            { name: "url", title: "URL", type: "string" },
          ],
        },
      ],
    }),
    defineField({
      name: "footerLinks",
      title: "Footer Navigation Links",
      type: "array",
      of: [
        {
          type: "object",
          name: "footerNavLink",
          title: "Footer Link",
          fields: [
            { name: "label", title: "Label", type: "string" },
            { name: "href", title: "Href / Target", type: "string" },
          ],
        },
      ],
    }),
  ],

  preview: {
    select: { title: "heroHeading" },
    prepare({ title }) {
      return { title: title || "Home Page" };
    },
  },
});
