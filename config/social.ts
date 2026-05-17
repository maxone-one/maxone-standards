/**
 * SSoT für Max Karastelev's Social-Media-Links.
 * Quelle: maxone.one/bio — dort immer zuerst aktualisieren.
 *
 * Sync in alle Projekte: node scripts/sync-social.mjs
 */

export const SOCIAL_LINKS = {
  github: {
    handle: "tech-frankenstein",
    url: "https://github.com/tech-frankenstein",
  },
  instagram: {
    handle: "tech.frankenstein",
    url: "https://www.instagram.com/tech.frankenstein/",
  },
  linkedin: {
    handle: "max-karastelev",
    url: "https://www.linkedin.com/in/max-karastelev/",
  },
  facebook: {
    handle: "max.karastelev.business",
    url: "https://www.facebook.com/max.karastelev.business",
  },
  tiktok: {
    handle: "tech.frankenstein",
    url: "https://www.tiktok.com/@tech.frankenstein",
  },
  telegram: {
    handle: "tech_frankenstein",
    url: "https://t.me/tech_frankenstein",
  },
} as const;

export type SocialPlatform = keyof typeof SOCIAL_LINKS;
