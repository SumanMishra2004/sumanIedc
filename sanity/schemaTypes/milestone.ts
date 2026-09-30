import { defineField, defineType } from "sanity";

export const milestone = defineType({
  name: "milestone",
  title: "Journey Milestone",
  type: "document",
  fields: [
    defineField({
      name: "year",
      title: "Year",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "tag",
      title: "Tag (short label)",
      type: "string",
      description: "E.g. GENESIS, INCUBATION, GROWTH",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "details",
      title: "Detail Bullet Points",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "iconName",
      title: "Icon Name (Lucide)",
      type: "string",
      description: "One of: Sparkles, Rocket, Award, Cpu, Globe",
      options: {
        list: [
          { title: "Sparkles", value: "Sparkles" },
          { title: "Rocket", value: "Rocket" },
          { title: "Award", value: "Award" },
          { title: "Cpu", value: "Cpu" },
          { title: "Globe", value: "Globe" },
          { title: "Lightbulb", value: "Lightbulb" },
          { title: "Star", value: "Star" },
          { title: "Zap", value: "Zap" },
        ],
      },
    }),
    defineField({
      name: "orderRank",
      title: "Order",
      type: "number",
      description: "Lower numbers appear first in the timeline.",
    }),
  ],
  orderings: [
    {
      title: "Order",
      name: "orderAsc",
      by: [{ field: "orderRank", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "year" },
  },
});
