import { absoluteUrl, siteName } from "@/lib/seo/metadata";

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: absoluteUrl("/"),
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: absoluteUrl("/"),
  };
}

export function webApplicationJsonLd({
  description,
  name,
  path,
}: {
  description: string;
  name: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    applicationCategory: "DeveloperApplication",
    description,
    name,
    operatingSystem: "Web",
    url: absoluteUrl(path),
  };
}

export function softwareApplicationJsonLd({
  description,
  name,
  path,
}: {
  description: string;
  name: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    applicationCategory: "DeveloperApplication",
    description,
    name,
    operatingSystem: "Web",
    url: absoluteUrl(path),
  };
}

export function organizationPageJsonLd({
  description,
  name,
  path,
  websiteUrl,
}: {
  description: string;
  name: string;
  path: string;
  websiteUrl: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    description,
    name,
    sameAs: websiteUrl ? [websiteUrl] : undefined,
    url: absoluteUrl(path),
  };
}

export function itemListJsonLd({
  items,
  name,
  path,
}: {
  items: { name: string; path: string }[];
  name: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: absoluteUrl(path),
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
}

export function articleJsonLd({
  dateModified,
  description,
  path,
  title,
}: {
  dateModified: string;
  description: string;
  path: string;
  title: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    dateModified,
    description,
    headline: title,
    mainEntityOfPage: absoluteUrl(path),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      item: absoluteUrl(item.path),
      name: item.name,
      position: index + 1,
    })),
  };
}
