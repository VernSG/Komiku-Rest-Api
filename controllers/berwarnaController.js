const cheerio = require("cheerio");
const {
  BASE_URL,
  fetchHtml,
  getAbsoluteUrl,
  normalizeText,
  cleanTitle,
  getImageUrl,
  extractMangaSlug,
  getApiChapterLink,
  logEmptyParse,
} = require("./scraperUtils");

console.log("Loading berwarna route for Express 5...");

async function getBerwarnaHtml(page) {
  const validPage = Math.max(1, parseInt(page, 10) || 1);
  const pageUrl =
    validPage === 1
      ? `${BASE_URL}/other/berwarna/`
      : `${BASE_URL}/other/berwarna/page/${validPage}/`;
  const shellHtml = await fetchHtml(pageUrl);
  const $shell = cheerio.load(shellHtml);
  const htmxUrl = $shell("[hx-get], [data-hx-get]").first().attr("hx-get");

  if (!htmxUrl) {
    logEmptyParse("GET /berwarna shell", shellHtml, {
      target: pageUrl,
      selector: "[hx-get], [data-hx-get]",
    });
    return { html: shellHtml, pageUrl, htmxUrl: null, validPage };
  }

  const html = await fetchHtml(htmxUrl, {
    headers: {
      "HX-Request": "true",
      Referer: pageUrl,
    },
  });

  return { html, pageUrl, htmxUrl: getAbsoluteUrl(htmxUrl), validPage };
}

function parseCard($, el) {
  const card = $(el);
  const mangaLinkElement =
    card.find('h3 a[href*="/manga/"], h2 a[href*="/manga/"], h4 a[href*="/manga/"]').first()
      .length
      ? card.find('h3 a[href*="/manga/"], h2 a[href*="/manga/"], h4 a[href*="/manga/"]').first()
      : card.find('a[href*="/manga/"]').first();
  const url = getAbsoluteUrl(mangaLinkElement.attr("href"));
  const slug = extractMangaSlug(url);
  const img = card.find('a[href*="/manga/"] img, img').first();
  const type = normalizeText(card.find(".tpe1_inf b, .tpe1_inf strong").first().text());
  const typeGenreText = normalizeText(card.find(".tpe1_inf").first().text());
  const chapterLinks = card.find('a[href*="chapter"]').toArray();
  const firstChapterElement = chapterLinks.length ? $(chapterLinks[0]) : null;
  const latestChapterElement = chapterLinks.length
    ? $(chapterLinks[chapterLinks.length - 1])
    : null;

  return {
    title:
      cleanTitle(card.find("h3, h2, h4").first().text()) ||
      cleanTitle(mangaLinkElement.attr("title")) ||
      cleanTitle(img.attr("alt")),
    thumbnail: getImageUrl($, img),
    type: type || "Unknown",
    genre: typeGenreText.replace(type, "").trim(),
    url,
    detailUrl: slug ? `/detail-komik/${slug}` : "",
    description: normalizeText(card.find("p").first().text()),
    stats: normalizeText(card.find(".judul2").first().text()),
    firstChapter: firstChapterElement
      ? {
          title:
            normalizeText(firstChapterElement.attr("title")) ||
            normalizeText(firstChapterElement.text()),
          url: getApiChapterLink(firstChapterElement.attr("href")),
        }
      : null,
    latestChapter: latestChapterElement
      ? {
          title:
            normalizeText(latestChapterElement.attr("title")) ||
            normalizeText(latestChapterElement.text()),
          url: getApiChapterLink(latestChapterElement.attr("href")),
        }
      : null,
  };
}

async function scrapeBerwarna(page = 1) {
  const { html, pageUrl, htmxUrl, validPage } = await getBerwarnaHtml(page);
  const $ = cheerio.load(html);
  const seen = new Set();
  const results = $('.bge:has(a[href*="/manga/"]), article:has(a[href*="/manga/"])')
    .toArray()
    .map((el) => parseCard($, el))
    .filter((item) => {
      const slug = extractMangaSlug(item.url);
      if (!item.title || !item.thumbnail || !slug || seen.has(slug)) return false;
      seen.add(slug);
      return true;
    });

  if (!results.length) {
    logEmptyParse("GET /berwarna", html, {
      target: htmxUrl || pageUrl,
      selector: '.bge/article + a[href*="/manga/"]',
    });
  }

  return {
    page: validPage,
    results,
    total: results.length,
    success: true,
  };
}

const berwarnaController = {
  getBerwarnaList: async (req, res) => {
    try {
      const data = await scrapeBerwarna(1);
      res.json({
        status: true,
        message: "Success",
        data,
      });
    } catch (error) {
      console.error("Route /berwarna error:", error.message);
      res.status(500).json({
        status: false,
        message: "Failed to fetch manga data",
        error: error.message,
        page: 1,
      });
    }
  },

  getBerwarnaByPage: async (req, res) => {
    try {
      const pageParam = req.params.page;
      const pageNum = parseInt(pageParam, 10);

      if (isNaN(pageNum) || pageNum < 1 || !Number.isInteger(pageNum)) {
        return res.status(400).json({
          status: false,
          message: "Page parameter must be a positive integer",
          data: [],
          received: pageParam,
        });
      }

      const data = await scrapeBerwarna(pageNum);
      res.json({
        status: true,
        message: "Success",
        data,
      });
    } catch (error) {
      console.error("Route /berwarna/:page error:", error.message);
      res.status(500).json({
        status: false,
        message: "Failed to fetch manga data",
        error: error.message,
        page: req.params.page,
      });
    }
  },
};

console.log("Berwarna routes configured successfully for Express 5");

module.exports = berwarnaController;
