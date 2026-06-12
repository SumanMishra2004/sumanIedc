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
  ],

  preview: {
    select: { title: "heroHeading" },
    prepare({ title }) {
      return { title: title || "Home Page" };
    },
  },
});
