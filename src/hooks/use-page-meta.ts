import { useEffect } from "react";

const SITE_URL = "https://www.passportphotovalidator.com";
const DEFAULT_TITLE = "Passport & Driver's License Renewal Photos | Verify, Crop & Order";
const DEFAULT_DESCRIPTION = "Check if your passport or driver's license renewal photo meets country requirements. We verify compliance, crop to the required size, remove the background if needed, and let you order online.";
const DEFAULT_CANONICAL = `${SITE_URL}/`;
const DEFAULT_OG_TITLE = "Passport & Driver's License Renewal Photos";
const DEFAULT_OG_DESCRIPTION = "Verify your renewal photo, crop it to the right size, remove the background if needed, and order online.";
const DEFAULT_TWITTER_TITLE = DEFAULT_OG_TITLE;
const DEFAULT_TWITTER_DESCRIPTION = DEFAULT_OG_DESCRIPTION;
const DEFAULT_ROBOTS = "index,follow";

type PageMetaOptions = {
  title?: string;
  description?: string;
  canonicalPath?: string;
  openGraphTitle?: string;
  openGraphDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  robots?: string;
};

function upsertNamedMeta(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", name);
    document.head.appendChild(meta);
  }

  meta.setAttribute("content", content);
}

function upsertPropertyMeta(property: string, content: string) {
  let meta = document.querySelector(`meta[property="${property}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("property", property);
    document.head.appendChild(meta);
  }

  meta.setAttribute("content", content);
}

function upsertCanonicalLink(href: string) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }

  link.setAttribute("href", href);
}

export function usePageMeta({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  canonicalPath = "/",
  openGraphTitle = title,
  openGraphDescription = description,
  twitterTitle = openGraphTitle,
  twitterDescription = openGraphDescription,
  robots = DEFAULT_ROBOTS,
}: PageMetaOptions = {}) {
  useEffect(() => {
    const canonicalUrl = new URL(canonicalPath, SITE_URL).toString();

    document.title = title;
    upsertNamedMeta("description", description);
    upsertNamedMeta("robots", robots);
    upsertPropertyMeta("og:title", openGraphTitle);
    upsertPropertyMeta("og:description", openGraphDescription);
    upsertPropertyMeta("og:url", canonicalUrl);
    upsertNamedMeta("twitter:title", twitterTitle);
    upsertNamedMeta("twitter:description", twitterDescription);
    upsertCanonicalLink(canonicalUrl);

    return () => {
      document.title = DEFAULT_TITLE;
      upsertNamedMeta("description", DEFAULT_DESCRIPTION);
      upsertNamedMeta("robots", DEFAULT_ROBOTS);
      upsertPropertyMeta("og:title", DEFAULT_OG_TITLE);
      upsertPropertyMeta("og:description", DEFAULT_OG_DESCRIPTION);
      upsertPropertyMeta("og:url", DEFAULT_CANONICAL);
      upsertNamedMeta("twitter:title", DEFAULT_TWITTER_TITLE);
      upsertNamedMeta("twitter:description", DEFAULT_TWITTER_DESCRIPTION);
      upsertCanonicalLink(DEFAULT_CANONICAL);
    };
  }, [
    canonicalPath,
    description,
    openGraphDescription,
    openGraphTitle,
    robots,
    title,
    twitterDescription,
    twitterTitle,
  ]);
}
