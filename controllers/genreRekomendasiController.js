// File: routes/genre.js
const cheerio = require("cheerio");
const {
  BASE_URL,
  fetchHtml,
  getAbsoluteUrl,
  normalizeText,
  getImageUrl,
  logEmptyParse,
} = require("./scraperUtils");

const genreRekomendasi = async (req, res) => {
  try {
    const data = await fetchHtml(BASE_URL);

    const $ = cheerio.load(data);
    const genreRekomendasi = [];

    const genreCards = $(".ls3").length
      ? $(".ls3")
      : $('a[href*="/other/"], a[href*="/statusmanga/"]')
          .closest("article, li, div")
          .filter((_, el) => $(el).find("img").length > 0);

    genreCards.each((i, el) => {
      if (!$(el).find('a[href*="/genre/"], a[href*="/other/"], a[href*="/statusmanga/"]').length) return;
      const anchorTag = $(el).find("a").first();
      const imgTag = $(el).find("img");
      const titleElement = $(el).find("h4, h3").first();
      const readLinkElement =
        $(el).find('a[href*="/genre/"], a[href*="/other/"], a[href*="/statusmanga/"]').last();

      const title =
        normalizeText(titleElement.text()) ||
        normalizeText(anchorTag.attr("title")) ||
        normalizeText(imgTag.attr("alt"));
      const originalLinkPath = anchorTag.attr("href");
      const readLinkPath = readLinkElement.attr("href");
      const thumbnail = getImageUrl($, imgTag);

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
      const finalOriginalLink = getAbsoluteUrl(originalLinkPath);

      const finalReadLink = getAbsoluteUrl(readLinkPath);

      if (
        title &&
        thumbnail &&
        !genreRekomendasi.some((item) => item.originalLink === finalOriginalLink)
      ) {
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

    if (!genreRekomendasi.length) {
      logEmptyParse("GET /genre-rekomendasi", data, {
        target: BASE_URL,
        selector: '.ls3, a[href*="/genre/"], img',
      });
    }

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
