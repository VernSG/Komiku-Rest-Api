// File: routes/terbaru.js (atau nama file yang Anda inginkan)

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const router = express.Router();

const URL_KOMIKU = "https://komiku.org/";
const getTerbaru = async (req, res) => {
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
      timeout: 10000, // Opsional: 10 detik timeout
    });

    const $ = cheerio.load(data);
    const komikTerbaru = [];

    $("#Terbaru div.ls4w article.ls4").each((i, el) => {
      const element = $(el);

      const linkElement = element.find(".ls4v > a").first();
      const imgElement = linkElement.find("img");
      const detailElement = element.find(".ls4j");

      const titleFromImgAlt = imgElement
        .attr("alt")
        ?.replace(/^Baca (Manga|Manhwa|Manhua)\s+/i, "")
        .trim();
      const titleFromH3 = detailElement.find("h3 > a").text().trim();
      const title = titleFromH3 || titleFromImgAlt || "Judul Tidak Tersedia";

      const originalLinkPath = linkElement.attr("href");
      const originalLink = originalLinkPath?.startsWith("http")
        ? originalLinkPath
        : originalLinkPath
        ? `${URL_KOMIKU.slice(0, -1)}${originalLinkPath}`
        : null;

      let thumbnail = imgElement.attr("data-src");
      if (!thumbnail || thumbnail.trim() === "") {
        thumbnail = imgElement.attr("src");
      }
      // Opsional: Membersihkan URL thumbnail jika ada parameter yang tidak diinginkan (misal ?resize=)
      // if (thumbnail && thumbnail.includes('?')) {
      //   thumbnail = thumbnail.split('?')[0];
      // }

      const typeGenreTimeString = detailElement.find("span.ls4s").text().trim();
      let type = "Unknown";
      let genre = "Unknown";
      let updateTime = "Unknown";

      const typeMatch = typeGenreTimeString.match(/^(Manga|Manhwa|Manhua)/i);
      if (typeMatch) {
        type = typeMatch[0];
        const restOfString = typeGenreTimeString.substring(type.length).trim();
        const timeMatch = restOfString.match(/(.+?)\s+([\d\w\s]+lalu)$/i);
        if (timeMatch) {
          genre = timeMatch[1].trim();
          updateTime = timeMatch[2].trim();
        } else {
          genre = restOfString;
        }
      } else {
        const parts = typeGenreTimeString.split(/\s+/);
        if (parts.length >= 2) {
          if (parts[parts.length - 1] === "lalu" && parts.length > 2) {
            updateTime = parts.slice(-2).join(" ");
            genre = parts.slice(0, -2).join(" ");
          } else {
            genre = typeGenreTimeString;
          }
        } else {
          genre = typeGenreTimeString;
        }
      }

      const latestChapterElement = detailElement.find("a.ls24");
      const latestChapterTitle = latestChapterElement.text().trim();
      const latestChapterLinkPath = latestChapterElement.attr("href");
      const latestChapterLink = latestChapterLinkPath?.startsWith("http")
        ? latestChapterLinkPath
        : latestChapterLinkPath
        ? `${URL_KOMIKU.slice(0, -1)}${latestChapterLinkPath}`
        : null;

      const isColored = element.find(".ls4v span.warna").length > 0;
      const updateCountText = element.find(".ls4v span.up").text().trim();

      let mangaSlug = "";
      if (originalLinkPath) {
        const slugMatches = originalLinkPath.match(/\/manga\/([^/]+)/);
        if (slugMatches && slugMatches[1]) {
          mangaSlug = slugMatches[1];
        }
      }
      const apiDetailLink = mangaSlug ? `/detail-komik/${mangaSlug}` : null;

      let apiChapterLink = null;
      if (latestChapterLinkPath && mangaSlug) {
        const chapterNumMatch =
          latestChapterLinkPath.match(/-chapter-([\d.]+)\/?$/i) ||
          latestChapterLinkPath.match(/\/([\d.]+)\/?$/i);
        if (chapterNumMatch && chapterNumMatch[1]) {
          const chapterNumber = chapterNumMatch[1];
          apiChapterLink = `/baca-chapter/${mangaSlug}/${chapterNumber}`;
        }
      }

      if (
        title &&
        title !== "Judul Tidak Tersedia" &&
        thumbnail &&
        originalLink
      ) {
        komikTerbaru.push({
          title,
          originalLink,
          thumbnail,
          type,
          genre,
          updateTime,
          latestChapterTitle,
          latestChapterLink,
          isColored,
          updateCountText,
          mangaSlug,
          apiDetailLink,
          apiChapterLink,
        });
      }
    });

    res.json(komikTerbaru);
  } catch (err) {
    console.error("Kesalahan pada GET /terbaru:", err);
    res.status(500).json({
      error: "Gagal mengambil daftar komik terbaru dari server.",
      detail: err.message,
    });
  }
};

module.exports = { getTerbaru };
