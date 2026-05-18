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

const getSearch = async (req, res) => {
  const keyword = req.query.q;
  if (!keyword)
    return res.status(400).json({ error: "Parameter q wajib diisi" });

  const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(
    keyword
  )}&post_type=manga`;

  try {
    const html = await fetchHtml(searchUrl);
    const $ = cheerio.load(html);
    let hasil = parseResults($);

    if (!hasil.length) {
      const htmxUrl = $('[hx-get*="post_type=manga"], [data-hx-get*="post_type=manga"]')
        .first()
        .attr("hx-get");

      if (htmxUrl) {
        const htmxHtml = await fetchHtml(htmxUrl, {
          headers: {
            "HX-Request": "true",
            Referer: searchUrl,
          },
        });
        hasil = parseResults(cheerio.load(htmxHtml));

        if (!hasil.length) {
          logEmptyParse("GET /search htmx", htmxHtml, {
            target: getAbsoluteUrl(htmxUrl),
            selector: 'a[href*="/manga/"], img, h3',
          });
        }
      } else {
        logEmptyParse("GET /search", html, {
          target: searchUrl,
          selector: '[hx-get*="post_type=manga"], a[href*="/manga/"]',
        });
      }
    }

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
    console.error("Error GET /search:", err);
    res.status(500).json({
      status: false,
      message: "Gagal mengambil data",
      error: err.message,
    });
  }
};

function getCardElements($) {
  const selectors = [
    '.bge:has(a[href*="/manga/"])',
    'article:has(a[href*="/manga/"])',
    'li:has(a[href*="/manga/"])',
    'div:has(> a[href*="/manga/"]):has(img)',
  ];

  for (const selector of selectors) {
    const elements = $(selector).toArray();
    if (elements.length) return elements;
  }

  return $('a[href*="/manga/"]')
    .toArray()
    .map((link) => $(link).closest("article, li, div").get(0))
    .filter(Boolean);
}

function parseResults($) {
  const hasil = [];
  const seen = new Set();

  getCardElements($).forEach((el) => {
    const card = $(el);
    const mangaLinkElement =
      card.find('h1 a[href*="/manga/"], h2 a[href*="/manga/"], h3 a[href*="/manga/"], h4 a[href*="/manga/"]').first()
        .length
        ? card.find('h1 a[href*="/manga/"], h2 a[href*="/manga/"], h3 a[href*="/manga/"], h4 a[href*="/manga/"]').first()
        : card.find('a[href*="/manga/"]').first();
    const mangaLink = getAbsoluteUrl(mangaLinkElement.attr("href"));
    const slug = extractMangaSlug(mangaLink);
    if (!slug || seen.has(slug)) return;

    const img = card.find('a[href*="/manga/"] img, img').first();
    const type =
      normalizeText(card.find(".tpe1_inf b, .tpe1_inf strong, b, strong").first().text()) ||
      "";
    const typeGenreText = normalizeText(card.find(".tpe1_inf").first().text());
    const title =
      cleanTitle(card.find("h3, h2, h4").first().text()) ||
      cleanTitle(mangaLinkElement.attr("title")) ||
      cleanTitle(img.attr("alt"));

    if (!title) return;
    seen.add(slug);

    hasil.push({
      title,
      altTitle: normalizeText(card.find(".judul2").first().text()) || null,
      slug,
      href: `/detail-komik/${slug}/`,
      thumbnail: getImageUrl($, img) || "",
      type,
      genre: typeGenreText.replace(type, "").trim() || null,
      description: normalizeText(card.find("p").first().text()),
    });
  });

  return hasil;
}

module.exports = { getSearch };
