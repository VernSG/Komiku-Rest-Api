const axios = require("axios");

const BASE_URL = "https://komiku.org";
const PLACEHOLDER_IMAGE_RE = /\/asset\/img\/lazy\.jpg/i;

const requestHeaders = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  "Cache-Control": "no-cache",
};

function getAbsoluteUrl(url, baseUrl = BASE_URL) {
  if (!url || typeof url !== "string") return null;

  const trimmedUrl = url.trim();
  if (!trimmedUrl || trimmedUrl.startsWith("data:")) return null;

  try {
    return new URL(trimmedUrl, baseUrl).toString();
  } catch (error) {
    return null;
  }
}

async function fetchHtml(url, options = {}) {
  const absoluteUrl = getAbsoluteUrl(url);
  const { data } = await axios.get(absoluteUrl, {
    ...options,
    headers: {
      ...requestHeaders,
      Referer: BASE_URL + "/",
      ...(options.headers || {}),
    },
    timeout: options.timeout || 15000,
  });

  return data;
}

function normalizeText(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function cleanTitle(value) {
  return normalizeText(value)
    .replace(/^Baca\s+(Komik|Manga|Manhwa|Manhua)?\s*/i, "")
    .replace(/^Komik\s+/i, "")
    .trim();
}

function safeText(root, selector) {
  if (!root || !selector) return "";
  return normalizeText(root.find(selector).first().text());
}

function getSrcsetUrl(srcset) {
  if (!srcset) return null;
  const firstCandidate = srcset.split(",")[0]?.trim().split(/\s+/)[0];
  return firstCandidate || null;
}

function getImageUrl($, imgElement) {
  if (!imgElement || !imgElement.length) return null;

  const src =
    imgElement.attr("data-src") ||
    imgElement.attr("data-lazy-src") ||
    imgElement.attr("data-original") ||
    getSrcsetUrl(imgElement.attr("data-srcset") || imgElement.attr("srcset")) ||
    imgElement.attr("src");

  return getAbsoluteUrl(src);
}

function extractMangaSlug(url) {
  if (!url) return "";

  try {
    const { pathname } = new URL(url, BASE_URL);
    return pathname.match(/\/manga\/([^/]+)/i)?.[1] || "";
  } catch (error) {
    return String(url).match(/\/manga\/([^/]+)/i)?.[1] || "";
  }
}

function extractChapterNumber(url) {
  if (!url) return "";

  try {
    const { pathname } = new URL(url, BASE_URL);
    return (
      pathname.match(/-chapter-([\d.]+)\/?$/i)?.[1] ||
      pathname.match(/\/chapter\/([\d.]+)\/?$/i)?.[1] ||
      pathname.match(/\/([\d.]+)\/?$/i)?.[1] ||
      ""
    );
  } catch (error) {
    return (
      String(url).match(/-chapter-([\d.]+)\/?$/i)?.[1] ||
      String(url).match(/\/([\d.]+)\/?$/i)?.[1] ||
      ""
    );
  }
}

function extractChapterSlug(url) {
  if (!url) return "";

  try {
    const { pathname } = new URL(url, BASE_URL);
    return pathname.match(/\/([^/]+)-chapter-[^/]+\/?$/i)?.[1] || "";
  } catch (error) {
    return String(url).match(/\/([^/]+)-chapter-[^/]+\/?$/i)?.[1] || "";
  }
}

function getApiChapterLink(chapterUrl, fallbackMangaSlug = "") {
  const chapterNumber = extractChapterNumber(chapterUrl);
  const chapterSlug = fallbackMangaSlug || extractChapterSlug(chapterUrl);
  return chapterSlug && chapterNumber
    ? `/baca-chapter/${chapterSlug}/${chapterNumber}`
    : null;
}

function logEmptyParse(context, html, extra = {}) {
  console.error(`Parsing ${context} kosong dari Komiku.`, {
    ...extra,
    htmlPreview: normalizeText(html).slice(0, 1200),
  });
}

module.exports = {
  BASE_URL,
  PLACEHOLDER_IMAGE_RE,
  requestHeaders,
  getAbsoluteUrl,
  fetchHtml,
  normalizeText,
  cleanTitle,
  safeText,
  getImageUrl,
  extractMangaSlug,
  extractChapterNumber,
  extractChapterSlug,
  getApiChapterLink,
  logEmptyParse,
};
