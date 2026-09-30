"use client";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { presentationTool } from "sanity/presentation";
import { schemaTypes } from "./src/sanity/schemaTypes";
import { structure } from "./src/sanity/structure";
import { resolve } from "./src/sanity/presentation";
import { projectId, dataset, apiVersion } from "./src/sanity/env";

/** Types that must only ever have one document. See src/sanity/structure.ts. */
const SINGLETONS = ["siteSettings"];

export default defineConfig({
  basePath: "/studio",
  title: "Sly UX",
  projectId,
  dataset,
  schema: { types: schemaTypes },
  plugins: [
    structureTool({ structure }),
    // Visual Editing: the live site beside the editor, click any text to edit
    // it. Draft mode is turned on by src/app/api/draft-mode/enable.
    presentationTool({
      resolve,
      previewUrl: { previewMode: { enable: "/api/draft-mode/enable" } },
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  document: {
    // Hides singletons from the global "create new" menu. The structure pins
    // the document ID; this stops a second one being made from the + button.
    newDocumentOptions: (prev, { creationContext }) =>
      creationContext.type === "global"
        ? prev.filter((template) => !SINGLETONS.includes(template.templateId))
        : prev,
  },
});
