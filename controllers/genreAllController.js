// File: routes/genre-all.js
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const router = express.Router();
const URL_KOMIKU = "https://komiku.org/";

const getGenreAll = async (req, res) => {
  try {
    const { data } = await axios.get(URL_KOMIKU, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
      timeout: 10000, // Optional: 10 seconds timeout
    });

    const $ = cheerio.load(data);
    const allGenres = [];

    // Scraping semua genre dari ul.genre
    $("ul.genre li").each((i, el) => {
      const anchorTag = $(el).find("a");

      const title = anchorTag.text().trim();
      const originalLinkPath = anchorTag.attr("href");
      const titleAttr = anchorTag.attr("title");

      // Extract genre slug from URL
      let genreSlug = "";
      if (originalLinkPath) {
        const matches = originalLinkPath.match(/\/genre\/([^/]+)/);
        if (matches && matches[1]) {
          genreSlug = matches[1];
        }
      }

      const apiGenreLink = genreSlug ? `/genre/${genreSlug}` : originalLinkPath;

      // Memastikan originalLink adalah URL absolut
      const finalOriginalLink = originalLinkPath?.startsWith("http")
        ? originalLinkPath
        : originalLinkPath
        ? `${URL_KOMIKU.slice(0, -1)}${originalLinkPath}`
        : null;

      if (title && originalLinkPath) {
        allGenres.push({
          title,
          slug: genreSlug,
          // originalLink: finalOriginalLink,
          apiGenreLink,
          titleAttr: titleAttr || title,
        });
      }
    });

    res.json(allGenres);
  } catch (err) {
    console.error("Kesalahan pada GET /genre-all:", err.message);
    res.status(500).json({
      error: "Gagal mengambil semua genre dari server.",
      detail: err.message,
    });
  }
};

module.exports = { getGenreAll };
