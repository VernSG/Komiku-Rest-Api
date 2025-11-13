// File: routes/genre-detail.js
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const router = express.Router();

const URL_KOMIKU = "https://komiku.org/";

const URL_LOCAL = "https://mangaverse.my.id/";
// GET /genre/:slug - Mendapatkan manga berdasarkan genre (halaman 1)
// router.get("/:slug", async (req, res) => {
//   req.params.page = "1";
//   return handleGenreRequest(req, res);
// });

// // GET /genre/:slug/page/:page - Route untuk pagination yang benar
// router.get("/:slug/page/:page", async (req, res) => {
//   return handleGenreRequest(req, res);
// });

// // GET /genre/:slug/:page - Backward compatibility
// router.get("/:slug/:page", async (req, res) => {
//   return handleGenreRequest(req, res);
// });

// Function untuk handle request genre
async function handleGenreRequest(req, res) {
  try {
    const { slug, page = 1 } = req.params;

    // Validasi page number
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        error: "Invalid page number",
        message: "Page must be a positive integer",
      });
    }

    // Construct URL berdasarkan slug dan page - gunakan API URL
    const targetUrl = `https://api.komiku.org/genre/${slug}/page/${pageNum}/`;

    console.log(`Fetching: ${targetUrl}`);

    const { data } = await axios.get(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        Referer: "https://komiku.org/",
        Origin: "https://komiku.org",
      },
      timeout: 15000, // 15 seconds timeout
    });

    const $ = cheerio.load(data);
    const mangaList = [];

    // Debug: log berapa banyak elemen .bge yang ditemukan
    console.log(`Found ${$(".bge").length} .bge elements`);
    console.log("HTML length:", data.length);
    console.log("Is HTML?", data.includes("<html>"));

    // Log first 500 chars to see what we got
    console.log("Response preview:", data.substring(0, 500));

    // Coba selector alternatif jika .bge tidak ada
    let mangaElements = $(".bge");
    if (mangaElements.length === 0) {
      // Coba selector alternatif
      mangaElements = $(".daftar .bge, .list-manga .item, .manga-item, .entry");
      console.log(
        `Trying alternative selectors, found ${mangaElements.length} elements`
      );
    }

    // Scraping manga dari class "bge" atau selector alternatif
    mangaElements.each((i, el) => {
      const $el = $(el);

      // Ambil link manga - coba beberapa selector
      let mangaLinkElement = $el.find(".kan a").first();
      if (mangaLinkElement.length === 0) {
        mangaLinkElement = $el.find("a").first();
      }
      const mangaLink = mangaLinkElement.attr("href");

      // Ambil judul manga - coba beberapa selector
      let title = $el.find(".kan h3").text().trim();
      if (!title) {
        title = $el.find("h3, h2, .title, .judul").text().trim();
      }

      // Ambil thumbnail - coba beberapa selector
      let thumbnailElement = $el.find(".bgei img");
      if (thumbnailElement.length === 0) {
        thumbnailElement = $el.find("img").first();
      }

      let thumbnail = thumbnailElement.attr("src");
      if (!thumbnail || thumbnail.trim() === "") {
        thumbnail =
          thumbnailElement.attr("data-src") ||
          thumbnailElement.attr("data-lazy");
      }

      // Pastikan thumbnail adalah URL absolut
      if (thumbnail && !thumbnail.startsWith("http")) {
        thumbnail = thumbnail.startsWith("//")
          ? `https:${thumbnail}`
          : `${URL_LOCAL.slice(0, -1)}${thumbnail}`;
      }

      // Ambil tipe dan genre - parsing yang lebih robust
      const typeGenreElement = $el.find(".tpe1_inf");
      const typeGenreText = typeGenreElement.text().trim();

      let type = "";
      let genre = "";

      // Extract type dari <b> tag
      const typeElement = typeGenreElement.find("b");
      if (typeElement.length > 0) {
        type = typeElement.text().trim();
        // Genre adalah text setelah <b> tag
        genre = typeGenreText.replace(type, "").trim();
      } else {
        // Fallback ke regex jika tidak ada <b> tag
        const typeGenreMatch = typeGenreText.match(
          /^(Manga|Manhwa|Manhua)\s+(.+)$/
        );
        if (typeGenreMatch) {
          type = typeGenreMatch[1];
          genre = typeGenreMatch[2];
        }
      }

      // Ambil info tambahan (views, waktu, dll)
      const additionalInfo = $el.find(".judul2").text().trim();

      // Ambil deskripsi
      const description = $el.find(".kan p").text().trim();

      // Ambil chapter pertama dan terakhir
      const chapterElements = $el.find(".new1 a");
      let firstChapter = "";
      let latestChapter = "";
      let firstChapterLink = "";
      let latestChapterLink = "";

      if (chapterElements.length >= 1) {
        const firstChapterElement = $(chapterElements[0]);
        firstChapter = firstChapterElement.find("span").last().text().trim();
        firstChapterLink = firstChapterElement.attr("href");
      }

      if (chapterElements.length >= 2) {
        const latestChapterElement = $(chapterElements[1]);
        latestChapter = latestChapterElement.find("span").last().text().trim();
        latestChapterLink = latestChapterElement.attr("href");
      }

      // Ambil update status
      const updateStatus = $el.find(".up").text().trim();

      // Extract manga slug dari link
      let mangaSlug = "";
      if (mangaLink) {
        const slugMatch = mangaLink.match(/\/manga\/([^/]+)/);
        if (slugMatch && slugMatch[1]) {
          mangaSlug = slugMatch[1];
        }
      }

      // Ensure all links are absolute URLs
      const absoluteMangaLink = mangaLink?.startsWith("http")
        ? mangaLink
        : mangaLink
        ? `${URL_KOMIKU.slice(0, -1)}${mangaLink}`
        : null;

      const absoluteFirstChapterLink = firstChapterLink?.startsWith("http")
        ? firstChapterLink
        : firstChapterLink
        ? `${URL_KOMIKU.slice(0, -1)}${firstChapterLink}`
        : null;

      const absoluteLatestChapterLink = latestChapterLink?.startsWith("http")
        ? latestChapterLink
        : latestChapterLink
        ? `${URL_LOCAL.slice(0, -1)}${latestChapterLink}`
        : null;

      // Debug: log data yang ditemukan
      if (i < 3) {
        // Log hanya 3 item pertama untuk debug
        console.log(`Item ${i}:`, {
          title,
          thumbnail,
          mangaLink,
          hasRequiredData: !!(title && thumbnail),
        });
      }

      // Hanya tambahkan jika ada data penting
      if (title && thumbnail) {
        mangaList.push({
          title,
          slug: mangaSlug,
          type,
          genre,
          thumbnail,
          description,
          additionalInfo,
          updateStatus,
          // mangaLink: absoluteMangaLink,
          apiMangaLink: mangaSlug ? `/detail-komik/${mangaSlug}` : null,
          chapters: {
            first: {
              chapter: firstChapter,
              link: absoluteFirstChapterLink,
              apiLink: firstChapterLink ? `/chapter${firstChapterLink}` : null,
            },
            latest: {
              chapter: latestChapter,
              link: absoluteLatestChapterLink,
              apiLink:
                mangaSlug && latestChapter
                  ? `/baca-chapter/${mangaSlug}/${latestChapter.replace(
                      /[^0-9]/g,
                      ""
                    )}`
                  : null,
            },
          },
        });
      }
    });

    // Cek apakah ada pagination/loading indicator untuk halaman selanjutnya
    const hasNextPage =
      $("#hxloading").length > 0 ||
      $("span[hx-get]").length > 0 ||
      $(".pagination .next").length > 0 ||
      $(".next-page").length > 0;

    // Extract next page URL jika ada
    let nextPageUrl = null;
    const nextPageElement = $("span[hx-get]");
    if (nextPageElement.length > 0) {
      const hxGetUrl = nextPageElement.attr("hx-get");
      if (hxGetUrl) {
        console.log("Found hx-get URL:", hxGetUrl);
        const nextPageMatch = hxGetUrl.match(/page\/(\d+)/);
        if (nextPageMatch && nextPageMatch[1]) {
          const nextPageNum = parseInt(nextPageMatch[1]);
          nextPageUrl = `/genre/${slug}/page/${nextPageNum}`;
        }
      }
    } else {
      // Fallback: jika ada manga, assume ada next page (kecuali jumlah manga < expected)
      if (mangaList.length >= 10) {
        // Assuming 10+ manga per page means there might be more
        nextPageUrl = `/genre/${slug}/page/${pageNum + 1}`;
      }
    }

    // Response data
    const responseData = {
      success: true,
      genre: slug,
      currentPage: pageNum,
      totalManga: mangaList.length,
      hasNextPage,
      nextPageUrl,
      data: mangaList,
      debug: {
        targetUrl,
        elementsFound: mangaElements.length,
        pageTitle: $("title").text().trim(),
      },
    };

    // Jika tidak ada manga ditemukan
    if (mangaList.length === 0) {
      // Tambahan debug info
      const pageContent = $.html().substring(0, 500);
      console.log("Page content preview:", pageContent);

      return res.status(404).json({
        success: false,
        error: "No manga found",
        message: `No manga found for genre "${slug}" on page ${pageNum}`,
        genre: slug,
        currentPage: pageNum,
        debug: {
          targetUrl,
          pageTitle: $("title").text().trim(),
          elementsFound: mangaElements.length,
          possibleSelectors: [
            `.bge: ${$(".bge").length}`,
            `.daftar .bge: ${$(".daftar .bge").length}`,
            `.list-manga .item: ${$(".list-manga .item").length}`,
            `.manga-item: ${$(".manga-item").length}`,
            `.entry: ${$(".entry").length}`,
          ],
        },
      });
    }

    res.json(responseData);
  } catch (err) {
    console.error(
      `Error on GET /genre/${req.params.slug}/${req.params.page || 1}:`,
      err.message
    );

    // Handle specific error types
    if (err.response) {
      // Server responded with error status
      const statusCode = err.response.status;
      if (statusCode === 404) {
        return res.status(404).json({
          success: false,
          error: "Genre or page not found",
          message: `Genre "${req.params.slug}" or page ${
            req.params.page || 1
          } not found`,
          statusCode,
        });
      }
    }

    res.status(500).json({
      success: false,
      error: "Failed to fetch manga data",
      message: "Internal server error while fetching manga from genre",
      detail: err.message,
      genre: req.params.slug,
      page: parseInt(req.params.page, 10) || 1,
    });
  }
}
module.exports = { handleGenreRequest };
