const cheerio = require("cheerio");
const {
  BASE_URL,
  PLACEHOLDER_IMAGE_RE,
  getAbsoluteUrl,
  fetchHtml,
  normalizeText,
  cleanTitle,
  extractMangaSlug,
  extractChapterNumber,
  logEmptyParse,
} = require("./scraperUtils");

function parseTypeFromText(...values) {
  const joinedValue = values.map(normalizeText).filter(Boolean).join(" ");
  const typeMatch = joinedValue.match(/\b(Manga|Manhwa|Manhua)\b/i);

  if (!typeMatch) return "Unknown";

  const type = typeMatch[1].toLowerCase();
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function parseGenreAndUpdateTime($, card) {
  const metadataTexts = [];

  card.find("span, p, small").each((_, el) => {
    const text = normalizeText($(el).text());
    if (
      text &&
      !/^up\s*\d+/i.test(text) &&
      !/^chapter\b/i.test(text) &&
      !/^(manga|manhwa|manhua)$/i.test(text)
    ) {
      metadataTexts.push(text);
    }
  });

  const metadataText =
    metadataTexts.find((text) => /lalu|views|·|\|/i.test(text)) ||
    metadataTexts[0] ||
    "";

  const parts = metadataText
    .split(/\s*[·|]\s*/)
    .map(normalizeText)
    .filter(Boolean);

  const updateTime =
    parts.find((part) => /\blalu\b/i.test(part)) ||
    metadataText.match(/((?:\d+|se)?\s*\w+\s+lalu)/i)?.[1] ||
    "Unknown";

  const genre =
    parts.find((part) => !/\blalu\b|views?/i.test(part)) ||
    metadataText.replace(updateTime, "").replace(/views?/i, "").trim() ||
    "Unknown";

  return {
    genre: genre || "Unknown",
    updateTime: updateTime || "Unknown",
  };
}

function findTerbaruSection($) {
  const directSection = $("#Terbaru");
  if (directSection.length) return directSection.first();

  const sections = $("section, main, div")
    .toArray()
    .filter((el) => {
      const element = $(el);
      const headingText = normalizeText(
        element.children("h1,h2,h3,h4,header").first().text()
      );
      const hasUpdateHeading = /terbaru|update/i.test(headingText);
      const hasCards =
        element.find('a[href*="/manga/"]').length > 0 &&
        element.find('a[href*="chapter"]').length > 0;

      return hasUpdateHeading && hasCards;
    });

  return sections.length ? $(sections[0]) : null;
}

function getCandidateCards($, section) {
  const selectors = [
    "article",
    'li:has(a[href*="/manga/"]):has(a[href*="chapter"])',
    'div:has(> a[href*="/manga/"]):has(a[href*="chapter"])',
    'div:has(a[href*="/manga/"]):has(a[href*="chapter"]):has(img)',
  ];

  const root = section && section.length ? section : $.root();

  for (const selector of selectors) {
    const cards = root
      .find(selector)
      .toArray()
      .filter((el) => {
        const card = $(el);
        return (
          card.find('a[href*="/manga/"]').length > 0 &&
          card.find('a[href*="chapter"]').length > 0 &&
          card.find("img").length > 0
        );
      });

    if (cards.length) return cards;
  }

  return $('a[href*="/manga/"]')
    .toArray()
    .map((link) => $(link).closest("article, li, div").get(0))
    .filter(Boolean);
}

function parseCard($, cardElement) {
  const card = $(cardElement);
  const mangaLinkElement =
    card.find('h1 a[href*="/manga/"], h2 a[href*="/manga/"], h3 a[href*="/manga/"], h4 a[href*="/manga/"]').first()
      .length
      ? card.find('h1 a[href*="/manga/"], h2 a[href*="/manga/"], h3 a[href*="/manga/"], h4 a[href*="/manga/"]').first()
      : card.find('a[href*="/manga/"]').filter((_, el) => normalizeText($(el).text())).first()
          .length
        ? card.find('a[href*="/manga/"]').filter((_, el) => normalizeText($(el).text())).first()
        : card.find('a[href*="/manga/"]').first();

  const imageElement =
    card.find('a[href*="/manga/"] img').first().length
      ? card.find('a[href*="/manga/"] img').first()
      : card.find("img").first();

  const originalLink = getAbsoluteUrl(mangaLinkElement.attr("href"));
  const title =
    cleanTitle(mangaLinkElement.text()) ||
    cleanTitle(mangaLinkElement.attr("title")) ||
    cleanTitle(imageElement.attr("alt")) ||
    "Judul Tidak Tersedia";

  const thumbnailSource =
    imageElement.attr("data-src") ||
    imageElement.attr("data-lazy-src") ||
    imageElement.attr("data-original") ||
    imageElement.attr("src");
  const thumbnail = getAbsoluteUrl(thumbnailSource);

  const latestChapterElement =
    card.find('a[href*="chapter"]').filter((_, el) => normalizeText($(el).text())).first()
      .length
      ? card.find('a[href*="chapter"]').filter((_, el) => normalizeText($(el).text())).first()
      : card.find('a[href*="chapter"]').first();
  const latestChapterTitle =
    normalizeText(latestChapterElement.text()) ||
    normalizeText(latestChapterElement.attr("title"));
  const latestChapterLink = getAbsoluteUrl(latestChapterElement.attr("href"));
  const { genre, updateTime } = parseGenreAndUpdateTime($, card);
  const updateCountText =
    normalizeText(card.find("span").filter((_, el) => /^up\s*\d+/i.test(normalizeText($(el).text()))).first().text()) ||
    normalizeText(card.text()).match(/\bUp\s*\d+\b/i)?.[0] ||
    "";
  const type = parseTypeFromText(
    mangaLinkElement.attr("title"),
    imageElement.attr("alt"),
    card.text()
  );
  const isColored = /\b(berwarna|color|colored)\b/i.test(card.text());
  const mangaSlug = extractMangaSlug(originalLink);
  const chapterNumber = extractChapterNumber(latestChapterLink);

  return {
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
    apiDetailLink: mangaSlug ? `/detail-komik/${mangaSlug}` : null,
    apiChapterLink:
      mangaSlug && chapterNumber
        ? `/baca-chapter/${mangaSlug}/${chapterNumber}`
        : null,
  };
}

function parseTerbaruHtml(html) {
  const $ = cheerio.load(html);
  const section = findTerbaruSection($);
  const candidateCards = getCandidateCards($, section);
  const seen = new Set();

  return candidateCards
    .map((card) => parseCard($, card))
    .filter((item) => {
      const hasRequiredData =
        item.title &&
        item.title !== "Judul Tidak Tersedia" &&
        item.originalLink &&
        item.thumbnail &&
        !PLACEHOLDER_IMAGE_RE.test(item.thumbnail);

      const key = `${item.mangaSlug}:${item.latestChapterLink || ""}`;
      if (!hasRequiredData || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

const getTerbaru = async (req, res) => {
  try {
    const data = await fetchHtml(BASE_URL);

    const komikTerbaru = parseTerbaruHtml(data);

    if (!komikTerbaru.length) {
      logEmptyParse("GET /terbaru", data, { target: BASE_URL });

      return res.status(502).json({
        error:
          "Gagal parsing daftar komik terbaru dari Komiku: hasil kosong.",
        detail:
          "Struktur HTML Komiku kemungkinan berubah atau halaman target tidak memuat daftar terbaru.",
      });
    }

    res.json(komikTerbaru);
  } catch (err) {
    console.error("Kesalahan pada GET /terbaru:", err);
    res.status(500).json({
      error: "Gagal mengambil daftar komik terbaru dari server.",
      detail: err.message,
    });
  }
};

module.exports = { getTerbaru, getAbsoluteUrl };
