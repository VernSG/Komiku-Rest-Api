// File: routes/genre.js
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const router = express.Router();
const URL_KOMIKU = "https://komiku.org/";

const genreRekomendasi = async (req, res) => {
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
    const genreRekomendasi = [];

    // Scraping bagian rekomendasi genre dengan gambar (ls3)
    $(".ls3").each((i, el) => {
      const anchorTag = $(el).find("a").first();
      const imgTag = $(el).find("img");
      const titleElement = $(el).find(".ls3p h4");
      const readLinkElement = $(el).find(".ls3p a");

      const title = titleElement.text().trim();
      const originalLinkPath = anchorTag.attr("href");
      const readLinkPath = readLinkElement.attr("href");

      let thumbnail = imgTag.attr("src");
      if (!thumbnail || thumbnail.trim() === "") {
        thumbnail = imgTag.attr("data-src");
      }

      // Extract genre slug from URL
      let genreSlug = "";
      if (originalLinkPath) {
        const matches = originalLinkPath.match(/\/genre\/([^/]+)/);
        if (matches && matches[1]) {
          genreSlug = matches[1];
        } else {
          // Handle special cases like /other/berwarna/ or /statusmanga/end/
          const otherMatches = originalLinkPath.match(
            /\/(other|statusmanga)\/([^/]+)/
          );
          if (otherMatches && otherMatches[2]) {
            genreSlug = otherMatches[2];
          }
        }
      }

      const apiGenreLink = genreSlug ? `/genre/${genreSlug}` : originalLinkPath;

      // Memastikan originalLink adalah URL absolut
      const finalOriginalLink = originalLinkPath?.startsWith("http")
        ? originalLinkPath
        : originalLinkPath
        ? `${URL_KOMIKU.slice(0, -1)}${originalLinkPath}`
        : null;

      // Memastikan readLink adalah URL absolut
      const finalReadLink = readLinkPath?.startsWith("http")
        ? readLinkPath
        : readLinkPath
        ? `${URL_KOMIKU.slice(0, -1)}${readLinkPath}`
        : null;

      if (title && thumbnail) {
        genreRekomendasi.push({
          title,
          slug: genreSlug,
          originalLink: finalOriginalLink,
          readLink: finalReadLink,
          apiGenreLink,
          thumbnail,
        });
      }
    });

    res.json(genreRekomendasi);
  } catch (err) {
    console.error("Kesalahan pada GET /genre:", err.message);
    res.status(500).json({
      error: "Gagal mengambil genre rekomendasi dari server.",
      detail: err.message,
    });
  }
};

module.exports = { genreRekomendasi };
