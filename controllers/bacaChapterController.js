const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const router = express.Router();

const URL_BASE = "https://komiku.org/"; // Renamed for clarity

function extractSlugAndChapter(url) {
  // Regex to match URLs like /slug-chapter-123/ or /manga/slug/chapter/123/ (more flexible)
  const matches =
    url.match(/\/([^\/]+?)-chapter-([^\/]+?)(?:\/|$)/) ||
    url.match(/\/manga\/[^\/]+\/chapter\/([^\/]+?)(?:\/|$)/);
  if (matches && matches[1] && matches[2]) {
    return {
      slug: matches[1],
      chapter: matches[2],
    };
  } else if (url.includes("-chapter-")) {
    // Fallback for simpler /slug-chapter-num/ pattern
    const parts = url.split("/");
    const chapterPart = parts.find((part) => part.includes("-chapter-"));
    if (chapterPart) {
      const chapterMatch = chapterPart.match(/^(.*?)-chapter-(.*?)$/);
      if (chapterMatch && chapterMatch[1] && chapterMatch[2]) {
        return {
          slug: chapterMatch[1],
          chapter: chapterMatch[2],
        };
      }
    }
  }
  return { slug: "", chapter: "" };
}

const getBacaChapter = async (req, res) => {
  try {
    const { slug, chapter } = req.params;
    const chapterUrl = `${URL_BASE}${slug}-chapter-${chapter}/`;

    const { data } = await axios.get(chapterUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        Referer: "https://komiku.id/",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
        timeout: 10000, // Optional: 10 seconds timeout
      },
    });

    const $ = cheerio.load(data);

    const breadcrumb = []; // Kept for potential future use, but commented out in response
    $("#breadcrumb li").each((i, el) => {
      const text = $(el).find("span").text().trim();
      const link = $(el).find("a").attr("href");

      let detailLink = null;
      if (link && link.includes("/manga/")) {
        const matches = link.match(/\/manga\/([^/]+)/);
        if (matches && matches[1]) {
          detailLink = `/detail-komik/${matches[1]}`;
        }
      }

      breadcrumb.push({
        text,
        originalLink: link || "",
        apiLink: detailLink,
      });
    });

    const title = $("#Judul h1").text().trim();
    const mangaTitleElement = $("#Judul p a b");
    const mangaTitle = mangaTitleElement.text().trim();
    const mangaLink = mangaTitleElement.parent().attr("href"); // Get href from parent <a> of <b>
    const description =
      $("#Description")
        .first()
        .contents()
        .filter(function () {
          return this.type === "text";
        })
        .text()
        .trim() +
      " " +
      $("#Description b").first().text().trim() +
      " " +
      $("#Description a[href='/'] b").first().text().trim();

    let mangaSlug = "";
    if (mangaLink) {
      const mangaMatches = mangaLink.match(/\/manga\/([^/]+)/);
      if (mangaMatches && mangaMatches[1]) {
        mangaSlug = mangaMatches[1];
      }
    }

    const chapterInfo = {};
    $("#Judul table.tbl tbody tr").each((i, el) => {
      const key = $(el).find("td").first().text().trim();
      const value = $(el).find("td").last().text().trim();
      chapterInfo[key] = value;
    });

    const images = [];
    $("#Baca_Komik img").each((i, el) => {
      const src = $(el).attr("src");
      const alt = $(el).attr("alt");
      const id = $(el).attr("id");

      // Revised condition to correctly match image URLs from komiku.id's upload directories
      if (
        src &&
        (src.includes("komiku.org/upload") ||
          src.includes("cdn.komiku.org/upload") ||
          src.includes("img.komiku.org/upload")) &&
        id
      ) {
        images.push({
          src,
          alt,
          id,
          fallbackSrc: src
            .replace("cdn.komiku.id", "img.komiku.id")
            .replace("komiku.id/upload", "img.komiku.id/upload"), // More robust fallback
        });
      }
    });

    const chapterValueInfo = $(".chapterInfo").attr("valuechapter") || "";
    const totalImages =
      $(".chapterInfo").attr("valuegambar") || images.length.toString();
    const viewAnalyticsUrl = $(".chapterInfo").attr("valueview") || "";
    const additionalDescription = $("#Komentar p").first().text().trim();
    const publishDate =
      $("time[property='datePublished']").attr("datetime") ||
      $("time").first().text().trim();

    // Revised selectors for previous and next chapter links
    // These links are often within a specific navigation bar, e.g., #set<chapter_id> .nxpr
    // Using a more general approach first, then trying specific if needed.
    // The provided HTML uses #set<numbers> as ID for the floating nav bar.
    // We target links within .nxpr which usually holds prev/next/all_chapters links.

    let prevChapterLink = "";
    // Komiku uses a link with class 'rl' (read left) for previous chapter
    // It's usually inside a div with class 'nxpr' in a floating menu (e.g., id="setxxxxx")
    const prevLinkElement = $(".nxpr a.rl[href*='-chapter-']");
    if (prevLinkElement.length > 0) {
      prevChapterLink = prevLinkElement.attr("href");
    } else {
      // Fallback if the specific structure changed, less reliable
      // This was your original, which might be too broad or rely on text not present
      // prevChapterLink = $("a:contains('Chapter Sebelumnya')").attr("href") || "";
    }

    let nextChapterLink = "";
    // Komiku might use 'rr' (read right) or it's the other chapter link in .nxpr
    const nextLinkElementRR = $(".nxpr a.rr[href*='-chapter-']");
    if (nextLinkElementRR.length > 0) {
      nextChapterLink = nextLinkElementRR.attr("href");
    } else {
      // Fallback: Find any link in .nxpr that looks like a chapter link and isn't the previous one or the all chapters list
      $(".nxpr a[href*='-chapter-']").each((i, el) => {
        const potentialNextHref = $(el).attr("href");
        if (potentialNextHref !== prevChapterLink) {
          nextChapterLink = potentialNextHref;
          return false; // Found a potential next link
        }
      });
    }

    let prevChapterInfo = null;
    if (prevChapterLink) {
      const { slug: prevSlug, chapter: prevChapter } =
        extractSlugAndChapter(prevChapterLink);
      if (prevSlug && prevChapter) {
        prevChapterInfo = {
          originalLink: prevChapterLink.startsWith("http")
            ? prevChapterLink
            : `${URL_BASE}${
                prevChapterLink.startsWith("/")
                  ? prevChapterLink.substring(1)
                  : prevChapterLink
              }`,
          apiLink: `/baca-chapter/${prevSlug}/${prevChapter}`,
          slug: prevSlug,
          chapter: prevChapter,
        };
      }
    }

    let nextChapterInfo = null;
    if (nextChapterLink) {
      const { slug: nextSlug, chapter: nextChapter } =
        extractSlugAndChapter(nextChapterLink);
      if (nextSlug && nextChapter) {
        nextChapterInfo = {
          originalLink: nextChapterLink.startsWith("http")
            ? nextChapterLink
            : `${URL_BASE}${
                nextChapterLink.startsWith("/")
                  ? nextChapterLink.substring(1)
                  : nextChapterLink
              }`,
          apiLink: `/baca-chapter/${nextSlug}/${nextChapter}`,
          slug: nextSlug,
          chapter: nextChapter,
        };
      }
    }

    res.json({
      // breadcrumb, // Uncomment if needed
      title,
      mangaInfo: {
        title: mangaTitle,
        originalLink: mangaLink?.startsWith("http")
          ? mangaLink
          : mangaLink
          ? `${URL_BASE}${
              mangaLink.startsWith("/") ? mangaLink.substring(1) : mangaLink
            }`
          : null,
        apiLink: mangaSlug ? `/detail-komik/${mangaSlug}` : null,
        slug: mangaSlug,
      },
      description,
      chapterInfo,
      images,
      meta: {
        chapterNumber: chapterValueInfo || chapter,
        totalImages: parseInt(totalImages) || 0,
        publishDate,
        viewAnalyticsUrl,
        slug: slug, // current slug
      },
      navigation: {
        prevChapter: prevChapterInfo,
        nextChapter: nextChapterInfo,
        allChapters: mangaSlug ? `/detail-komik/${mangaSlug}` : null, // Link to see all chapters, typically the manga detail page
      },
      additionalDescription,
    });
  } catch (err) {
    console.error("Error fetching chapter:", err);
    res.status(500).json({
      error: "Gagal mengambil data chapter komik",
      detail: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

router.get("/url", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        error: "URL parameter diperlukan",
      });
    }

    if (!url.includes("komiku.id/") || !url.includes("chapter")) {
      return res.status(400).json({
        error: "URL tidak valid, harus dari komiku.id dan berisi 'chapter'",
      });
    }

    const { slug, chapter } = extractSlugAndChapter(url);

    if (!slug || !chapter) {
      return res.status(400).json({
        error: "URL tidak valid, tidak bisa mengekstrak slug dan nomor chapter",
      });
    }
    // Redirect to the main route
    return res.redirect(`/baca-chapter/${slug}/${chapter}`);
  } catch (err) {
    console.error("Error fetching chapter from URL:", err);
    res.status(500).json({
      error: "Gagal mengambil data chapter komik dari URL",
      detail: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
});

module.exports = { getBacaChapter };
