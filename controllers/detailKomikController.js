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
  extractChapterSlug,
  logEmptyParse,
} = require("./scraperUtils");

function getChapterApiLink(chapterLink) {
  const chapterSlug = extractChapterSlug(chapterLink);
  const chapterNumber = extractChapterNumber(chapterLink);
  return chapterSlug && chapterNumber
    ? `/baca-chapter/${chapterSlug}/${chapterNumber}`
    : null;
}

function parseChapterLink($, linkElement) {
  const originalLink = getAbsoluteUrl(linkElement.attr("href"));
  const title =
    normalizeText(linkElement.find("span").last().text()) ||
    normalizeText(linkElement.text()) ||
    normalizeText(linkElement.attr("title"));

  return {
    title,
    originalLink,
    apiLink: getChapterApiLink(originalLink),
    chapterNumber: extractChapterNumber(originalLink),
  };
}

function findLabeledChapterLink($, label) {
  const candidates = $("#Judul div, section#Informasi div")
    .toArray()
    .filter((el) => normalizeText($(el).text()).startsWith(label))
    .sort(
      (a, b) => normalizeText($(a).text()).length - normalizeText($(b).text()).length
    );

  return candidates.length
    ? $(candidates[0]).find('a[href*="chapter"]').first()
    : $();
}

async function scrapeKomikDetail(url) {
  const data = await fetchHtml(url);
  const $ = cheerio.load(data);

  const title =
    normalizeText($("h1 [itemprop='name']").first().text()) ||
    normalizeText($("h1").first().text());
  const alternativeTitle = normalizeText($("p.j2").first().text());
  const description = normalizeText($("p.desc").first().text());
  const sinopsis =
    normalizeText($("section#Sinopsis p").first().text()) ||
    normalizeText(
      $("section")
        .filter((_, el) => /sinopsis/i.test(normalizeText($(el).text())))
        .find("p")
        .first()
        .text()
    );

  const thumbnail =
    getImageUrl($, $("section#Informasi img").first()) ||
    getAbsoluteUrl($("meta[itemprop='image']").attr("content")) ||
    getImageUrl($, $("article img").first());

  const infoTable = {};
  $("section#Informasi table tr, section#Informasi .inftable tr").each(
    (_, el) => {
      const cells = $(el).find("td, th");
      const key = normalizeText(cells.first().text()).replace(/:$/, "");
      const value = normalizeText(cells.last().text());
      if (key && value && key !== value) infoTable[key] = value;
    }
  );

  const genres = [
    ...new Set(
      [
        ...$("section#Informasi a[href*='/genre/'], section#Informasi ul.genre li")
          .toArray()
          .map((el) => normalizeText($(el).text())),
        ...$("meta[itemprop='genre']")
          .toArray()
          .map((el) => normalizeText($(el).attr("content"))),
      ].filter(Boolean)
    ),
  ];

  const komikSlug = extractMangaSlug(url);
  const firstChapterElement = findLabeledChapterLink($, "Awal:");
  const latestChapterElement = findLabeledChapterLink($, "Terbaru:");

  const firstChapter = parseChapterLink($, firstChapterElement);
  const latestChapter = parseChapterLink($, latestChapterElement);

  const chapters = [];
  const chapterRows = $("section#Chapter table tr, table#Daftar_Chapter tr")
    .toArray()
    .filter((el) => $(el).find('a[href*="chapter"]').length);

  chapterRows.forEach((el) => {
    const row = $(el);
    const chapterLinkElement = row.find('a[href*="chapter"]').first();
    const chapter = parseChapterLink($, chapterLinkElement);
    const cells = row.find("td");
    chapters.push({
      ...chapter,
      views: normalizeText(row.find(".pembaca, td.pembaca, i").first().text()),
      date:
        normalizeText(row.find(".tanggalseries").first().text()) ||
        normalizeText(cells.last().text()),
    });
  });

  if (!chapters.length) {
    $('a[href*="chapter"]').each((_, el) => {
      const chapter = parseChapterLink($, $(el));
      if (chapter.originalLink && chapter.title) {
        chapters.push({ ...chapter, views: "", date: "" });
      }
    });
  }

  const similarKomik = [];
  $("section#Spoiler, section")
    .filter((_, el) => /Komik Serupa/i.test(normalizeText($(el).text())))
    .find('a[href*="/manga/"]')
    .each((_, el) => {
      const linkElement = $(el);
      const card = linkElement.closest("article, li, div");
      const originalLink = getAbsoluteUrl(linkElement.attr("href"));
      const slug = extractMangaSlug(originalLink);
      const img = card.find("img").first();
      const type =
        normalizeText(card.find("strong, b").first().text()) ||
        normalizeText(card.find("[itemprop='additionalType']").attr("content"));

      const item = {
        title:
          cleanTitle(card.find(".h4, h3, h4").first().text()) ||
          cleanTitle(linkElement.attr("title")) ||
          cleanTitle(img.attr("alt")),
        originalLink,
        apiLink: slug ? `/detail-komik/${slug}` : null,
        thumbnail: getImageUrl($, img),
        type,
        genres: normalizeText(card.find(".tpe1_inf").text()).replace(type, "").trim(),
        synopsis: normalizeText(card.find("p").first().text()),
        views: normalizeText(card.find(".vw").first().text()),
        slug,
      };

      if (
        item.title &&
        item.originalLink &&
        !similarKomik.some((komik) => komik.slug === item.slug)
      ) {
        similarKomik.push(item);
      }
    });

  if (!title || !thumbnail || !chapters.length) {
    logEmptyParse("GET /detail-komik", data, {
      target: url,
      titleFound: !!title,
      thumbnailFound: !!thumbnail,
      chaptersFound: chapters.length,
      selectors:
        "h1, section#Informasi img, section#Chapter a[href*='chapter']",
    });
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
    firstChapter,
    latestChapter,
    chapters,
    similarKomik,
  };
}

const getDetail = async (req, res) => {
  try {
    const { slug } = req.params;
    const komikUrl = `${BASE_URL}/manga/${slug}/`;
    const komikDetail = await scrapeKomikDetail(komikUrl);

    if (!komikDetail.title || !komikDetail.chapters.length) {
      return res.status(502).json({
        error: "Gagal parsing detail komik dari Komiku.",
        detail:
          "Struktur HTML detail komik kemungkinan berubah atau data chapter kosong.",
      });
    }

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

module.exports = { getDetail };
