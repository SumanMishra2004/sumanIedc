import { defineField, defineType } from "sanity";

export const teamPage = defineType({
  name: "teamPage",
  title: "Team Page",
  type: "document",
  fields: [
    defineField({
      name: "eyebrow",
      title: "Eyebrow Label",
      type: "string",
      initialValue: "◆ INTELLECT GROUP ◆",
    }),
    defineField({
      name: "heading",
      title: "Main Heading",
      type: "string",
      initialValue: "Meet Our Team",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
      initialValue:
        "Bringing together specialized faculty mentorship and enthusiastic student innovators to bridge the gap between academic projects and industrial breakthroughs.",
    }),
  ],
  preview: {
    prepare() {
      return { title: "Team Page" };
    },
  },
});
