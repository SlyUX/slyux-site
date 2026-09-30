import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "./env";
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
});

/**
 * A Sanity "Viewer" token, used only in draft mode so the Studio's
 * Presentation tool can preview drafts (Visual Editing). Not NEXT_PUBLIC, so
 * Next never ships it to the browser. Without it the preview shows published
 * content only.
 */
export const readToken = process.env.SANITY_API_READ_TOKEN;
