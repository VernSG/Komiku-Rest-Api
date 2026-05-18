const cheerio = require("cheerio");
const {
  BASE_URL,
  fetchHtml,
  getAbsoluteUrl,
  normalizeText,
  cleanTitle,
  getImageUrl,
  extractMangaSlug,
  logEmptyParse,
} = require("./scraperUtils");

const getRekomendasi = async (req, res) => {
  try {
    const data = await fetchHtml(BASE_URL);
    const $ = cheerio.load(data);
    const section =
      $("#Rekomendasi_Komik").length > 0
        ? $("#Rekomendasi_Komik")
        : $("section")
            .filter((_, el) => /Peringkat|Rekomendasi/i.test($(el).text()))
            .first();
    const rekomendasi = [];
    const seen = new Set();

    section
      .find('article, li, div:has(a[href*="/manga/"])')
      .toArray()
      .forEach((el) => {
        const card = $(el);
        const anchorTag =
          card.find('h3 a[href*="/manga/"], h4 a[href*="/manga/"]').first()
            .length
            ? card.find('h3 a[href*="/manga/"], h4 a[href*="/manga/"]').first()
            : card.find('a[href*="/manga/"]').first();
        const originalLink = getAbsoluteUrl(anchorTag.attr("href"));
        const slug = extractMangaSlug(originalLink);
        if (!slug || seen.has(slug)) return;

        const imgTag = card.find('a[href*="/manga/"] img, img').first();
        const title =
          cleanTitle(anchorTag.text()) ||
          cleanTitle(anchorTag.attr("title")) ||
          cleanTitle(imgTag.attr("alt"));
        const thumbnail = getImageUrl($, imgTag);

        if (title && thumbnail && originalLink) {
          seen.add(slug);
          rekomendasi.push({
            title,
            originalLink,
            apiDetailLink: `/detail-komik/${slug}`,
            thumbnail,
          });
        }
      });

    if (!rekomendasi.length) {
      logEmptyParse("GET /rekomendasi", data, {
        target: BASE_URL,
        selector: '#Rekomendasi_Komik a[href*="/manga/"], img',
      });
    }

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
