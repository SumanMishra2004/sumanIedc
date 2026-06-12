import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemaTypes";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

export default defineConfig({
  name: "iedc-studio",
  title: "IEDC CMS Studio",
  projectId,
  dataset,
  basePath: "/studio",
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            // ── Singleton pages ──────────────────────────────────────
            S.listItem()
              .title("Home Page")
              .id("homePage")
              .child(
                S.document()
                  .schemaType("homePage")
                  .documentId("homePage")
                  .title("Home Page Content")
              ),
            S.listItem()
              .title("Contact Page")
              .id("contactPage")
              .child(
                S.document()
                  .schemaType("contactPage")
                  .documentId("contactPage")
                  .title("Contact Page Content")
              ),
            S.listItem()
              .title("Team Page")
              .id("teamPage")
              .child(
                S.document()
                  .schemaType("teamPage")
                  .documentId("teamPage")
                  .title("Team Page Content")
              ),
            S.divider(),
            // ── Collections ──────────────────────────────────────────
            S.documentTypeListItem("milestone").title("Journey Milestones"),
            S.documentTypeListItem("gallerySlide").title("Research Gallery Slides"),
            S.documentTypeListItem("teamMember").title("Team Members (Students)"),
          ]),
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
});
