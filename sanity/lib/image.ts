import imageUrlBuilder, { SanityImageSource } from "@sanity/image-url";

import { sanityClient } from "./client";

const builder = imageUrlBuilder(sanityClient);

/**
 * Returns an image URL builder for a Sanity image source.
 * Usage: urlFor(source).width(800).url()
 */
export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}
