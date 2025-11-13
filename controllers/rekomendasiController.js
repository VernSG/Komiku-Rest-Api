// File: routes/rekomendasi.js (atau nama file yang Anda gunakan untuk route ini)

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const router = express.Router();

const URL_KOMIKU = "https://komiku.org/";

const getRekomendasi = async (req, res) => {
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
    const rekomendasi = [];

    $("#Rekomendasi_Komik article.ls2").each((i, el) => {
      const anchorTag = $(el).find("a").first();
      const imgTag = $(el).find("img");

      const title = (
        imgTag.attr("alt") ||
        anchorTag.attr("alt") ||
        $(el).find(".ls2j h3 a").text()
      ) // Fallback ke teks di dalam <h3><a>
        ?.replace(/^Baca (Komik|Manga|Manhwa|Manhua)\s+/i, "")
        .trim();

      const originalLinkPath = anchorTag.attr("href");

      let thumbnail = imgTag.attr("data-src");
      if (!thumbnail || thumbnail.trim() === "") {
        thumbnail = imgTag.attr("src");
      }

      // if (thumbnail && thumbnail.includes('?')) {
      //   thumbnail = thumbnail.split('?')[0];
      // }

      let slug = "";
      if (originalLinkPath) {
        const matches = originalLinkPath.match(/\/manga\/([^/]+)/);
        if (matches && matches[1]) {
          slug = matches[1];
        }
      }

      const apiDetailLink = slug ? `/detail-komik/${slug}` : originalLinkPath;

      // Memastikan originalLink adalah URL absolut
      const finalOriginalLink = originalLinkPath?.startsWith("http")
        ? originalLinkPath
        : originalLinkPath
        ? `${URL_KOMIKU.slice(0, -1)}${originalLinkPath}`
        : null;

      if (title && thumbnail) {
        rekomendasi.push({
          title,
          originalLink: finalOriginalLink,
          apiDetailLink,
          thumbnail,
        });
      }
    });

    res.json(rekomendasi);
  } catch (err) {
    console.error("Kesalahan pada GET /rekomendasi:", err.message);
    res.status(500).json({
      error: "Gagal mengambil komik rekomendasi dari server.",
      detail: err.message,
    });
  }
};

module.exports = { getRekomendasi };
