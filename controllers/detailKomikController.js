const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const router = express.Router();

const URL = "https://komiku.org/";

async function scrapeKomikDetail(url) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        Referer: "https://komiku.id/",
        "Cache-Control": "public, max-age=3600",
      },
      timeout: 10000, // Timeout 10 detik
    });

    const $ = cheerio.load(data);

    const title = $("h1 span[itemprop='name']").text().trim();
    const alternativeTitle = $("p.j2").text().trim();
    const description = $("p.desc").text().trim();
    const sinopsis = $("section#Sinopsis p").text().trim();

    const thumbnail = $("section#Informasi div.ims img").attr("src");

    const infoTable = {};
    $("section#Informasi table.inftable tr").each((i, el) => {
      const key = $(el).find("td").first().text().trim();
      const value = $(el).find("td").last().text().trim();
      infoTable[key] = value;
    });

    const genres = [];
    $("section#Informasi ul.genre li").each((i, el) => {
      genres.push($(el).text().trim());
    });

    let komikSlug = "";
    const urlMatches = url.match(/\/manga\/([^/]+)/);
    if (urlMatches && urlMatches[1]) {
      komikSlug = urlMatches[1];
    }

    const firstChapterLink = $("#Judul div.new1:contains('Awal:') a").attr(
      "href"
    );
    const latestChapterLink = $("#Judul div.new1:contains('Terbaru:') a").attr(
      "href"
    );

    let firstChapterSlug = "";
    let firstChapterNumber = "";
    if (firstChapterLink) {
      const chapterMatches = firstChapterLink.match(
        /\/([^/]+)-chapter-([^/]+)\//
      );
      if (chapterMatches && chapterMatches[1] && chapterMatches[2]) {
        firstChapterSlug = chapterMatches[1];
        firstChapterNumber = chapterMatches[2];
      }
    }

    let latestChapterSlug = "";
    let latestChapterNumber = "";
    if (latestChapterLink) {
      const chapterMatches = latestChapterLink.match(
        /\/([^/]+)-chapter-([^/]+)\//
      );
      if (chapterMatches && chapterMatches[1] && chapterMatches[2]) {
        latestChapterSlug = chapterMatches[1];
        latestChapterNumber = chapterMatches[2];
      }
    }

    const firstChapter = {
      title: $("#Judul div.new1:contains('Awal:') a")
        .text()
        .replace("Awal:", "")
        .trim(),
      originalLink: firstChapterLink,
      apiLink:
        firstChapterSlug && firstChapterNumber
          ? `/baca-chapter/${firstChapterSlug}/${firstChapterNumber}`
          : null,
      chapterNumber: firstChapterNumber,
    };

    const latestChapter = {
      title: $("#Judul div.new1:contains('Terbaru:') a")
        .text()
        .replace("Terbaru:", "")
        .trim(),
      originalLink: latestChapterLink,
      apiLink:
        latestChapterSlug && latestChapterNumber
          ? `/baca-chapter/${latestChapterSlug}/${latestChapterNumber}`
          : null,
      chapterNumber: latestChapterNumber,
    };

    const chapters = [];
    $("table#Daftar_Chapter tbody tr").each((i, el) => {
      if ($(el).find("th").length > 0) return;

      const chapterTitle = $(el).find("td.judulseries a span").text().trim();
      const chapterLink = $(el).find("td.judulseries a").attr("href");
      const views = $(el).find("td.pembaca i").text().trim();
      const date = $(el).find("td.tanggalseries").text().trim();

      let chapterSlug = "";
      let chapterNumber = "";
      if (chapterLink) {
        const chapterMatches = chapterLink.match(/\/([^/]+)-chapter-([^/]+)\//);
        if (chapterMatches && chapterMatches[1] && chapterMatches[2]) {
          chapterSlug = chapterMatches[1];
          chapterNumber = chapterMatches[2];
        }
      }

      chapters.push({
        title: chapterTitle,
        originalLink: chapterLink,
        apiLink:
          chapterSlug && chapterNumber
            ? `/baca-chapter/${chapterSlug}/${chapterNumber}`
            : null,
        views,
        date,
        chapterNumber,
      });
    });

    const similarKomik = [];
    try {
      $("section#Spoiler div.grd").each((i, el) => {
        try {
          const title = $(el).find("div.h4").text().trim();
          const link = $(el).find("a").attr("href");

          // Perbaikan untuk menangani gambar lazy loading
          let thumbnail = $(el).find("img").attr("src") || "";

          // Jika gambar menggunakan lazy loading, ambil dari data-src
          if (
            $(el).find("img").hasClass("lazy") ||
            (thumbnail && thumbnail.includes("lazy.jpg"))
          ) {
            thumbnail = $(el).find("img").attr("data-src") || thumbnail;
          }

          const type = $(el).find("div.tpe1_inf b").text().trim() || "";
          const genres =
            $(el).find("div.tpe1_inf").text().replace(type, "").trim() || "";
          const synopsis = $(el).find("p").text().trim() || "";
          const views = $(el).find("div.vw").text().trim() || "";

          let similarKomikSlug = "";
          if (link) {
            const mangaMatches = link.match(/\/manga\/([^/]+)/);
            if (mangaMatches && mangaMatches[1]) {
              similarKomikSlug = mangaMatches[1];
            }
          }

          similarKomik.push({
            title,
            originalLink: link || "",
            apiLink: similarKomikSlug
              ? `/detail-komik/${similarKomikSlug}`
              : null,
            thumbnail,
            type,
            genres,
            synopsis,
            views,
            slug: similarKomikSlug,
          });
        } catch (itemError) {
          console.error("Error processing similar komik item:", itemError);
          // Lanjutkan ke item berikutnya
        }
      });
    } catch (sectionError) {
      console.error("Error processing similar komik section:", sectionError);
      // Tetap lanjutkan dengan similarKomik kosong
    }

    return {
      title,
      alternativeTitle,
      description,
      sinopsis,
      thumbnail,
      info: infoTable,
      genres,
      slug: komikSlug,
      firstChapter: {
        ...firstChapter,
        originalLink: firstChapterLink?.startsWith("http")
          ? firstChapterLink
          : `https://komiku.id${firstChapterLink}`,
      },
      latestChapter: {
        ...latestChapter,
        originalLink: latestChapterLink?.startsWith("http")
          ? latestChapterLink
          : `https://komiku.id${latestChapterLink}`,
      },
      chapters: chapters.map((chapter) => ({
        ...chapter,
        originalLink: chapter.originalLink?.startsWith("http")
          ? chapter.originalLink
          : `https://komiku.id${chapter.originalLink}`,
      })),
      similarKomik: similarKomik.map((komik) => ({
        ...komik,
        originalLink: komik.originalLink?.startsWith("http")
          ? komik.originalLink
          : `https://komiku.id${komik.originalLink}`,
      })),
    };
  } catch (error) {
    throw error;
  }
}

const getDetail = async (req, res) => {
  try {
    const { slug } = req.params;

    const komikUrl = `${URL}manga/${slug}/`;

    const komikDetail = await scrapeKomikDetail(komikUrl);
    res.json(komikDetail);
  } catch (err) {
    console.error("Error fetching komik detail:", err);
    res.status(500).json({
      error: "Gagal mengambil detail komik",
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

    if (
      !url.startsWith("https://komiku.id/manga/") &&
      !url.startsWith("http://komiku.id/manga/")
    ) {
      return res.status(400).json({
        error: "URL tidak valid, harus dari komiku.id/manga/",
      });
    }

    const komikDetail = await scrapeKomikDetail(url);
    res.json(komikDetail);
  } catch (err) {
    console.error("Error fetching komik detail from URL:", err);
    res.status(500).json({
      error: "Gagal mengambil detail komik",
      detail: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
});

module.exports = { getDetail };
