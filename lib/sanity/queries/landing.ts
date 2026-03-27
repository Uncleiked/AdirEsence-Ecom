import { defineQuery } from "next-sanity";

export const HERO_QUERY = defineQuery(`
  *[_type == "hero"] | order(_updatedAt desc)[0] {
    beatA,
    beatB,
    beatC,
    beatD,
    animationSequence->{
      title,
      "images": images[].asset->url
    }
  }
`);

export const ABOUT_QUERY = defineQuery(`
  *[_type == "about"] | order(_updatedAt desc)[0] {
    title,
    description,
    assetType,
    "image": image.asset->url,
    "video": video.asset->url,
    videoUrl
  }
`);

export const FEATURES_QUERY = defineQuery(`
  *[_type == "feature"] | order(order asc) {
    title,
    description,
    icon
  }
`);

export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_type == "siteSettings"] | order(_updatedAt desc)[0] {
    siteName,
    headerCtaText,
    headerCtaLink,
    socialLinks {
      facebook,
      instagram,
      x,
      pinterest,
      youtube,
      tiktok
    },
    footerLinks[] {
      title,
      url
    }
  }
`);

