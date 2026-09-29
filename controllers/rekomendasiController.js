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

    const rekomendasi = [];
    const seen = new Set();

    // The "Rekomendasi_Komik" section now renders its ranking panels
    // client-side (empty #rank-harian / #rank-mingguan divs). The actual
    // comic cards live in the "Terbaru" section as <article class="ls2">.
    let cards = $("#Terbaru article.ls2").toArray();

    // Fallback: any article containing a /manga/ link.
    if (!cards.length) {
      cards = $('article:has(a[href*="/manga/"])').toArray();
    }

    // Fallback: any anchor pointing to a manga detail page.
    if (!cards.length) {
      cards = $('a[href*="/manga/"]').toArray();
    }

    cards.forEach((el) => {
      const card = $(el);

      const anchorTag = card
        .find('h3 a[href*="/manga/"], h4 a[href*="/manga/"]')
        .first();
      const linkTag = anchorTag.length
        ? anchorTag
        : card.find('a[href*="/manga/"]').first();

      const originalLink = getAbsoluteUrl(linkTag.attr("href"));
      const slug = extractMangaSlug(originalLink);
      if (!slug || seen.has(slug)) return;

      const imgTag = card.find('a[href*="/manga/"] img, img').first();

      const title =
        cleanTitle(linkTag.text()) ||
        cleanTitle(linkTag.attr("title")) ||
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
        selector: '#Terbaru article.ls2 a[href*="/manga/"], img',
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