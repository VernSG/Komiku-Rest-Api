const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const router = express.Router();

const URL_KOMIKU = "https://komiku.org/";

/**
 * @param {cheerio.CheerioAPI} $
 * @param {string} sectionSelector
 * @returns {{title: string, items: Array<object>}}
 */
function scrapeKomikSection($, sectionSelector) {
  const sectionElement = $(sectionSelector);
  const resultItems = [];

  const sectionTitle = sectionElement.find("h2.lsh3").text().trim();

  sectionElement.find("article.ls2").each((i, el) => {
    const articleElement = $(el);
    const linkElement = articleElement.find(".ls2v > a").first();
    const imgElement = linkElement.find("img");
    const detailElement = articleElement.find(".ls2j");

    let title = imgElement
      .attr("alt")
      ?.replace(/^Baca (Manga|Manhwa|Manhua|Komik)\s+/i, "")
      .trim();
    if (!title) {
      title = detailElement.find("h3 a").text().trim();
    }

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
    // Opsional: Hapus query params jika tidak diinginkan, contoh: ?resize=
    // if (thumbnail && thumbnail.includes('?resize=')) {
    //   thumbnail = thumbnail.split('?resize=')[0];
    // }

    const infoText = detailElement.find(".ls2t").text().trim(); // e.g., "Fantasi 1.3jt pembaca"
    let genre = "";
    let readers = "";

    const pembacaMatch = infoText.match(
      /(.+?)\s+([\d.,]+[mjkrb龕万KMBT]?\s*pembaca)$/i
    );
    if (pembacaMatch) {
      genre = pembacaMatch[1].trim();
      readers = pembacaMatch[2].trim();
    } else {
      genre = infoText;
    }

    const latestChapterElement = detailElement.find("a.ls2l");
    const latestChapter = latestChapterElement.text().trim();
    const chapterLinkPath = latestChapterElement.attr("href");
    const originalChapterLink = chapterLinkPath?.startsWith("http")
      ? chapterLinkPath
      : chapterLinkPath
      ? `${URL_KOMIKU.slice(0, -1)}${chapterLinkPath}`
      : null;

    let mangaSlug = "";
    if (originalLinkPath) {
      const mangaMatches = originalLinkPath.match(/\/manga\/([^/]+)/);
      if (mangaMatches && mangaMatches[1]) {
        mangaSlug = mangaMatches[1];
      }
    }

    let chapterNumber = "";
    if (chapterLinkPath) {
      const chapterNumMatch =
        chapterLinkPath.match(/-chapter-([\d.]+)\/?$/i) ||
        chapterLinkPath.match(/\/chapter[_-]([\d.]+)\/?$/i) ||
        chapterLinkPath.match(/\/([\d.]+)\/?$/i);
      if (chapterNumMatch && chapterNumMatch[1]) {
        chapterNumber = chapterNumMatch[1];
      } else {
        const textMatch = latestChapter.match(/Chapter\s*([\d.]+)/i);
        if (textMatch && textMatch[1]) {
          chapterNumber = textMatch[1];
        }
      }
    }

    const apiDetailLink = mangaSlug ? `/detail-komik/${mangaSlug}` : null;
    const apiChapterLink =
      mangaSlug && chapterNumber
        ? `/baca-chapter/${mangaSlug}/${chapterNumber}`
        : null;

    if (title && thumbnail && originalLink) {
      resultItems.push({
        title,
        originalLink,
        apiDetailLink,
        thumbnail,
        genre,
        readers, // e.g., "1.3jt pembaca"
        latestChapter,
        originalChapterLink,
        apiChapterLink,
        mangaSlug,
        chapterNumber,
      });
    }
  });

  return { title: sectionTitle, items: resultItems };
}

// Route utama untuk mengambil semua data populer (Manga, Manhwa, Manhua)
const komikPopuler = async (req, res) => {
  try {
    const { data } = await axios.get(URL_KOMIKU, {
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

    const mangaPopuler = scrapeKomikSection($, "#Komik_Hot_Manga");
    const manhwaPopuler = scrapeKomikSection($, "#Komik_Hot_Manhwa");
    const manhuaPopuler = scrapeKomikSection($, "#Komik_Hot_Manhua");

    res.json({
      manga: mangaPopuler,
      manhwa: manhwaPopuler,
      manhua: manhuaPopuler,
    });
  } catch (err) {
    console.error("Error scraping semua komik populer:", err);
    res.status(500).json({
      error: "Gagal mengambil data komik populer",
      detail: err.message,
    });
  }
};

// Route spesifik untuk Manga Populer
const rekomendasiManga = async (req, res) => {
  try {
    const { data } = await axios.get(URL_KOMIKU, {
      headers: {
        // header
      },
    });
    const $ = cheerio.load(data);
    const mangaPopuler = scrapeKomikSection($, "#Komik_Hot_Manga");
    res.json(mangaPopuler);
  } catch (err) {
    console.error("Error scraping manga populer:", err);
    res.status(500).json({
      error: "Gagal mengambil data manga populer",
      detail: err.message,
    });
  }
};

// Route spesifik untuk Manhwa Populer
const rekomendasiManhwa = async (req, res) => {
  try {
    const { data } = await axios.get(URL_KOMIKU, {
      headers: {},
    });
    const $ = cheerio.load(data);
    const manhwaPopuler = scrapeKomikSection($, "#Komik_Hot_Manhwa");
    res.json(manhwaPopuler);
  } catch (err) {
    console.error("Error scraping manhwa populer:", err);
    res.status(500).json({
      error: "Gagal mengambil data manhwa populer",
      detail: err.message,
    });
  }
};

// Route spesifik untuk Manhua Populer
const rekomendasiManhua = async (req, res) => {
  try {
    const { data } = await axios.get(URL_KOMIKU, {
      headers: {},
    });
    const $ = cheerio.load(data);
    const manhuaPopuler = scrapeKomikSection($, "#Komik_Hot_Manhua");
    res.json(manhuaPopuler);
  } catch (err) {
    console.error("Error scraping manhua populer:", err);
    res.status(500).json({
      error: "Gagal mengambil data manhua populer",
      detail: err.message,
    });
  }
};

module.exports = {
  komikPopuler,
  rekomendasiManga,
  rekomendasiManhwa,
  rekomendasiManhua,
};
