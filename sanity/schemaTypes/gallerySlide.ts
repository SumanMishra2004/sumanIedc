import { defineField, defineType } from "sanity";

export const gallerySlide = defineType({
  name: "gallerySlide",
  title: "Research Gallery Slide",
  type: "document",
  fields: [
    defineField({
      name: "label",
      title: "Label (main heading)",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      description: "E.g. 'Imaging · Level 4'",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "year",
      title: "Year",
      type: "string",
    }),
    defineField({
      name: "accentColor",
      title: "Accent Color (hex)",
      type: "string",
      description: "Hex color used for the HUD text and progress bar. E.g. #c9f53b",
      initialValue: "#c9f53b",
    }),
    defineField({
      name: "image",
      title: "Slide Image",
      type: "image",
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "orderRank",
      title: "Order",
      type: "number",
      description: "Lower numbers appear first in the carousel.",
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
    select: {
      title: "label",
      subtitle: "category",
      media: "image",
    },
  },
});
