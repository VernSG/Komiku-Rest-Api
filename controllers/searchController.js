const express = require("express");
const router = express.Router();
const axios = require("axios");
const cheerio = require("cheerio");

const getSearch = async (req, res) => {
  const keyword = req.query.q;
  if (!keyword)
    return res.status(400).json({ error: "Parameter q wajib diisi" });

  try {
    console.log(`Mencari manga dengan keyword: ${keyword}`);

    const searchUrl = `https://komiku.org/?s=${encodeURIComponent(
      keyword
    )}&post_type=manga`;

    const { data } = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        Referer: "https://komiku.id/",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });

    const $ = cheerio.load(data);
    let hasil = [];

    const htmxElement = $(".daftar span[hx-get]");
    let useBackupMethod = false;

    if (htmxElement.length > 0) {
      const htmxApiUrl = htmxElement.attr("hx-get");
      console.log("Ditemukan elemen HTMX, melakukan request ke:", htmxApiUrl);

      if (htmxApiUrl) {
        try {
          // Request ke API HTMX
          const htmxResponse = await axios.get(htmxApiUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
              Accept: "text/html",
              "HX-Request": "true",
              Referer: searchUrl,
            },
          });

          const htmxHtml = htmxResponse.data;
          const $htmx = cheerio.load(htmxHtml);

          if ($htmx(".bge").length > 0) {
            console.log("Ditemukan hasil dari API HTMX");
            parseResults($htmx, hasil);
          } else {
            useBackupMethod = true;
          }
        } catch (htmxError) {
          console.error("Error saat mengambil data HTMX:", htmxError.message);
          useBackupMethod = true;
        }
      } else {
        useBackupMethod = true;
      }
    }

    if (hasil.length === 0 || useBackupMethod) {
      console.log("Menggunakan metode parsing regular");
      parseResults($, hasil);
    }

    if (hasil.length === 0) {
      console.log(
        "Tidak ada hasil ditemukan dengan metode standar, mencoba parser generik"
      );

      $("a").each((i, el) => {
        if ($(el).attr("href") && $(el).attr("href").includes("/manga/")) {
          const link = $(el).attr("href");
          const title = $(el).text().trim() || $(el).find("h3").text().trim();

          if (title && title.length > 3) {
            const slug = link.replace(/^.*\/manga\//, "").replace(/\/$/, "");
            let thumbnail = $(el).find("img").attr("src") || "";

            hasil.push({
              title,
              slug,
              href: `/detail-komik/${slug}/`,
              thumbnail,
              source: "generic-parser",
            });
          }
        }
      });

      const slugs = new Set();
      hasil = hasil.filter((item) => {
        if (!slugs.has(item.slug)) {
          slugs.add(item.slug);
          return true;
        }
        return false;
      });
    }

    // Status response
    res.json({
      status: true,
      message:
        hasil.length > 0
          ? "Berhasil mendapatkan hasil pencarian"
          : "Tidak ada hasil pencarian ditemukan",
      keyword,
      url: searchUrl,
      total: hasil.length,
      data: hasil,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({
      status: false,
      message: "Gagal mengambil data",
      error: err.message,
    });
  }
};

function parseResults($, hasil) {
  $(".bge").each((i, el) => {
    try {
      const bgei = $(el).find(".bgei");
      const kan = $(el).find(".kan");

      const mangaLink = bgei.find("a").attr("href") || "";
      const slug = mangaLink.replace("/manga/", "").replace(/\/$/, "");

      const thumbnail = bgei.find("img").attr("src") || "";

      const title = kan.find("h3").text().trim();

      const altTitle = kan.find(".judul2").text().trim();

      const description = kan.find("p").text().trim();

      const type = bgei.find(".tpe1_inf b").text().trim();

      const genre = bgei.find(".tpe1_inf").text().replace(type, "").trim();

      const chapterAwal = kan
        .find(".new1")
        .first()
        .find("span:last-child")
        .text()
        .trim();
      const chapterTerbaru = kan
        .find(".new1")
        .last()
        .find("span:last-child")
        .text()
        .trim();

      const href = `/detail-komik/${slug}/`;

      const chapterAwalLink =
        kan.find(".new1").first().find("a").attr("href") || "";
      const chapterTerbaruLink =
        kan.find(".new1").last().find("a").attr("href") || "";

      const formatChapterLink = (link) => {
        if (!link) return "";

        const cleanLink = link.replace(/^https?:\/\/komiku\.id/i, "");

        const linkWithSlash = cleanLink.startsWith("/")
          ? cleanLink
          : `/${cleanLink}`;

        const chapterSlug = linkWithSlash.replace(/^\//, "");

        return `/baca-chapter/${chapterSlug}`;
      };
      hasil.push({
        title,
        altTitle: altTitle || null,
        slug,
        href,
        thumbnail,
        type,
        genre: genre || null,
        description,
        // chapter: {
        //   awal: {
        //     number: chapterAwal,
        //     link: formatChapterLink(chapterAwalLink),
        //   },
        //   terbaru: {
        //     number: chapterTerbaru,
        //     link: formatChapterLink(chapterTerbaruLink),
        //   },
        // },
      });
    } catch (error) {
      console.log("Error parsing manga item:", error);
    }
  });
}

module.exports = { getSearch };
