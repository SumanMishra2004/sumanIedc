import { defineField, defineType } from "sanity";

export const contactPage = defineType({
  name: "contactPage",
  title: "Contact Page",
  type: "document",
  fields: [
    defineField({
      name: "pageDescription",
      title: "Page Description",
      type: "text",
      rows: 2,
      description: "Short blurb shown under the 'Contact Us' heading.",
      initialValue:
        "Have an innovative idea, research query, or want to collaborate with IEDC? Fill out the form below or reach us directly.",
    }),
    defineField({
      name: "connectDescription",
      title: "Left Panel Description",
      type: "text",
      rows: 3,
      description: "Text shown on the left info panel above the contact details.",
      initialValue:
        "Whether you are a student developer looking for research resources, an academic requesting patent drafts, or an industry partner seeking hardware solutions, we are here to support you.",
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "text",
      rows: 2,
      initialValue: "Innovation Block, Research Park,\nKolkata 700 001, West Bengal, India",
    }),
    defineField({
      name: "emails",
      title: "Email Addresses",
      type: "array",
      of: [{ type: "string" }],
      initialValue: ["contact@iedc.edu.in", "research.coordinator@iedc.edu.in"],
    }),
    defineField({
      name: "phones",
      title: "Phone Numbers",
      type: "array",
      of: [
        defineField({
          name: "phoneEntry",
          title: "Phone Entry",
          type: "object",
          fields: [
            { name: "label", title: "Label", type: "string" },
            { name: "number", title: "Number", type: "string" },
          ],
          preview: {
            select: { title: "label", subtitle: "number" },
          },
        }),
      ],
      initialValue: [
        { label: "Main Desk", number: "+91 98765 43210" },
        { label: "Research Lab Coordinator", number: "+91 98765 01234" },
      ],
    }),
    defineField({
      name: "workingHours",
      title: "Working Hours",
      type: "text",
      rows: 2,
      initialValue: "Monday – Saturday: 9:00 AM – 7:00 PM\n(24/7 Access for Incubated Teams)",
    }),
  ],
  preview: {
    prepare() {
      return { title: "Contact Page" };
    },
  },
});
