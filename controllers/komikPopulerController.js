const cheerio = require("cheerio");
const {
  BASE_URL,
  fetchHtml,
  getAbsoluteUrl,
  normalizeText,
  cleanTitle,
  getImageUrl,
  extractMangaSlug,
  extractChapterNumber,
  getApiChapterLink,
  logEmptyParse,
} = require("./scraperUtils");

function parseType(...values) {
  const text = values.map(normalizeText).join(" ");
  const match = text.match(/\b(Manga|Manhwa|Manhua)\b/i);
  if (!match) return "";
  const type = match[1].toLowerCase();
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function parseKomikCard($, el) {
  const card = $(el);
  const mangaLinkElement =
    card.find('h3 a[href*="/manga/"], h4 a[href*="/manga/"]').first().length
      ? card.find('h3 a[href*="/manga/"], h4 a[href*="/manga/"]').first()
      : card.find('a[href*="/manga/"]').first();
  const originalLink = getAbsoluteUrl(mangaLinkElement.attr("href"));
  const mangaSlug = extractMangaSlug(originalLink);
  const img = card.find('a[href*="/manga/"] img, img').first();
  const infoText = normalizeText(
    card.find("span, p, small").filter((_, node) => /views?|pembaca|·/i.test($(node).text())).first().text()
  );
  const infoParts = infoText.split(/\s*[·|]\s*/).map(normalizeText).filter(Boolean);
  const genre = infoParts.find((part) => !/views?|pembaca/i.test(part)) || "";
  const readers = infoParts.find((part) => /views?|pembaca/i.test(part)) || "";
  const latestChapterElement = card.find('a[href*="chapter"]').last();
  const originalChapterLink = getAbsoluteUrl(latestChapterElement.attr("href"));
  const latestChapter =
    normalizeText(latestChapterElement.text()) ||
    normalizeText(latestChapterElement.attr("title"));
  const chapterNumber =
    extractChapterNumber(originalChapterLink) ||
    latestChapter.match(/Chapter\s*([\d.]+)/i)?.[1] ||
    "";

  return {
    title:
      cleanTitle(mangaLinkElement.text()) ||
      cleanTitle(mangaLinkElement.attr("title")) ||
      cleanTitle(img.attr("alt")),
    originalLink,
    apiDetailLink: mangaSlug ? `/detail-komik/${mangaSlug}` : null,
    thumbnail: getImageUrl($, img),
    genre,
    readers,
    latestChapter,
    originalChapterLink,
    apiChapterLink: getApiChapterLink(originalChapterLink, mangaSlug),
    mangaSlug,
    chapterNumber,
    type: parseType(mangaLinkElement.attr("title"), img.attr("alt"), card.text()),
  };
}

function scrapeKomikSection($, sectionSelector, fallbackTitle, typeFilter = "") {
  const sectionElement = $(sectionSelector).length
    ? $(sectionSelector)
    : $("section")
        .filter((_, el) => /Komik Populer|Populer Update|Peringkat/i.test($(el).text()))
        .first();
  const title =
    normalizeText(sectionElement.find("h1,h2,h3").first().text()) ||
    fallbackTitle;
  const seen = new Set();
  const cardElements = sectionElement.find('article:has(a[href*="/manga/"])').length
    ? sectionElement.find('article:has(a[href*="/manga/"])')
    : sectionElement.find('li:has(a[href*="/manga/"]), div:has(> a[href*="/manga/"])');
  const items = cardElements
    .toArray()
    .map((el) => parseKomikCard($, el))
    .filter((item) => {
      if (
        !item.title ||
        !item.originalLink ||
        !item.thumbnail ||
        seen.has(item.mangaSlug)
      ) {
        return false;
      }

      if (typeFilter && item.type !== typeFilter) return false;
      seen.add(item.mangaSlug);
      return true;
    })
    .map(({ type, ...item }) => item);

  return { title: fallbackTitle || title, items };
}

async function loadHomepage() {
  const data = await fetchHtml(BASE_URL);
  return { data, $: cheerio.load(data) };
}

function ensureItems(context, data, result) {
  if (!result.items.length) {
    logEmptyParse(context, data, {
      target: BASE_URL,
      selector: '#Komik_Populer a[href*="/manga/"], a[href*="chapter"], img',
    });
  }
}

const komikPopuler = async (req, res) => {
  try {
    const { data, $ } = await loadHomepage();
    const mangaPopuler = scrapeKomikSection($, "#Komik_Populer", "Manga Populer", "Manga");
    const manhwaPopuler = scrapeKomikSection($, "#Komik_Populer", "Manhwa Populer", "Manhwa");
    const manhuaPopuler = scrapeKomikSection($, "#Komik_Populer", "Manhua Populer", "Manhua");

    ensureItems("GET /komik-populer manga", data, mangaPopuler);

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

const rekomendasiManga = async (req, res) => {
  try {
    const { data, $ } = await loadHomepage();
    const mangaPopuler = scrapeKomikSection($, "#Komik_Populer", "Manga Populer", "Manga");
    ensureItems("GET /komik-populer/manga", data, mangaPopuler);
    res.json(mangaPopuler);
  } catch (err) {
    console.error("Error scraping manga populer:", err);
    res.status(500).json({
      error: "Gagal mengambil data manga populer",
      detail: err.message,
    });
  }
};

const rekomendasiManhwa = async (req, res) => {
  try {
    const { data, $ } = await loadHomepage();
    const manhwaPopuler = scrapeKomikSection($, "#Komik_Populer", "Manhwa Populer", "Manhwa");
    ensureItems("GET /komik-populer/manhwa", data, manhwaPopuler);
    res.json(manhwaPopuler);
  } catch (err) {
    console.error("Error scraping manhwa populer:", err);
    res.status(500).json({
      error: "Gagal mengambil data manhwa populer",
      detail: err.message,
    });
  }
};

const rekomendasiManhua = async (req, res) => {
  try {
    const { data, $ } = await loadHomepage();
    const manhuaPopuler = scrapeKomikSection($, "#Komik_Populer", "Manhua Populer", "Manhua");
    ensureItems("GET /komik-populer/manhua", data, manhuaPopuler);
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
