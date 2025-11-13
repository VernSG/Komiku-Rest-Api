const express = require("express");
const router = express.Router();
const axios = require("axios");
const cheerio = require("cheerio");

console.log("Loading berwarna route for Express 5...");

// Function to get random delay between 1-3 seconds
const getRandomDelay = () =>
  Math.floor(Math.random() * (3000 - 1000 + 1) + 1000);

// Function to get random user agent
const getRandomUserAgent = () => {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
};

// Function to extract slug from URL
const extractSlug = (url) => {
  if (!url || typeof url !== "string") return "";
  try {
    const matches = url.match(/\/manga\/(.*?)\//);
    return matches && matches[1] ? matches[1] : "";
  } catch (error) {
    console.error("Error extracting slug:", error);
    return "";
  }
};

// Add this helper function to format chapter URL
const formatChapterUrl = (url) => {
  // Extract the manga title and chapter number
  const match = url.match(/\/([^/]+)-chapter-(\d+)/);
  if (match) {
    const [, title, chapter] = match;
    return `/baca-chapter/${title}/${chapter}`;
  }
  return url;
};

// Function to scrape manga data from a given page
async function scrapeBerwarna(page = 1) {
  try {
    console.log(`Scraping berwarna page ${page}...`);

    // Validate page parameter
    const validPage = Math.max(1, parseInt(page) || 1);

    // Add delay before request
    await new Promise((resolve) => setTimeout(resolve, getRandomDelay()));

    const url =
      validPage === 1
        ? "https://api.komiku.org/other/berwarna/"
        : `https://api.komiku.org/other/berwarna/page/${validPage}/`;

    console.log(`Requesting URL: ${url}`);

    const response = await axios.get(url, {
      headers: {
        "User-Agent": getRandomUserAgent(),
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Cache-Control": "max-age=0",
        Referer: "https://komiku.org/",
      },
      timeout: 15000,
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data);
    const mangaList = [];

    $(".bge").each((i, element) => {
      try {
        const $el = $(element);
        const url = $el.find(".bgei a").attr("href") || "";
        const slug = extractSlug(url);

        // Get chapter elements
        const firstChapterElement = $el.find(".new1 a").first();
        const lastChapterElement = $el.find(".new1 a").last();

        const manga = {
          title: $el.find("h3").text().trim() || `Manga ${i + 1}`,
          thumbnail: $el.find(".sd").attr("src") || "",
          type: $el.find(".tpe1_inf b").text().trim() || "Unknown",
          genre:
            $el
              .find(".tpe1_inf")
              .text()
              .replace($el.find(".tpe1_inf b").text(), "")
              .trim() || "",
          url: url,
          detailUrl: slug ? `/detail-komik/${slug}` : "",
          description: $el.find(".kan p").text().trim() || "",
          stats: $el.find(".judul2").text().trim() || "",
          firstChapter: firstChapterElement.length
            ? {
                title: firstChapterElement.attr("title") || "",
                url: formatChapterUrl(firstChapterElement.attr("href") || ""),
              }
            : null,
          latestChapter: lastChapterElement.length
            ? {
                title: lastChapterElement.attr("title") || "",
                url: formatChapterUrl(lastChapterElement.attr("href") || ""),
              }
            : null,
        };

        mangaList.push(manga);
      } catch (elementError) {
        console.error(`Error processing element ${i}:`, elementError.message);
      }
    });

    console.log(
      `Successfully scraped ${mangaList.length} manga from page ${validPage}`
    );

    return {
      page: validPage,
      results: mangaList,
      total: mangaList.length,
      success: true,
    };
  } catch (error) {
    console.error("Error scraping manga:", error.message);
    throw new Error(
      `Failed to scrape data from page ${page}: ${error.message}`
    );
  }
}

// ROUTES - Express 5 compatible (NO REGEX PATTERNS)

// Route untuk halaman pertama
const berwarnaController = {
  getBerwarnaList: async (req, res) => {
    try {
      console.log("GET /berwarna - fetching page 1");
      const data = await scrapeBerwarna(1);
      res.json({
        status: true,
        message: "Success",
        data: data,
      });
    } catch (error) {
      console.error("Route /berwarna error:", error.message);
      res.status(500).json({
        status: false,
        message: "Failed to fetch manga data",
        error: error.message,
        page: 1,
      });
    }
  },

  // Route dengan parameter sederhana (tanpa regex)
  getBerwarnaByPage: async (req, res) => {
    try {
      const pageParam = req.params.page;
      console.log(`GET /berwarna/${pageParam}`);

      // Manual validation untuk memastikan parameter adalah angka
      const pageNum = parseInt(pageParam);

      if (isNaN(pageNum) || pageNum < 1 || !Number.isInteger(pageNum)) {
        return res.status(400).json({
          status: false,
          message: "Page parameter must be a positive integer",
          data: [],
          received: pageParam,
        });
      }

      const data = await scrapeBerwarna(pageNum);
      res.json({
        status: true,
        message: "Success",
        data: data,
      });
    } catch (error) {
      console.error("Route /berwarna/:page error:", error.message);
      res.status(500).json({
        status: false,
        message: "Failed to fetch manga data",
        error: error.message,
        page: req.params.page,
      });
    }
  },
};

console.log("Berwarna routes configured successfully for Express 5");

module.exports = berwarnaController;
