const cheerio = require("cheerio");
const {
  BASE_URL,
  fetchHtml,
  getAbsoluteUrl,
  normalizeText,
  getImageUrl,
  extractMangaSlug,
  extractChapterNumber,
  extractChapterSlug,
  logEmptyParse,
} = require("./scraperUtils");

function extractSlugAndChapter(url) {
  const absoluteUrl = getAbsoluteUrl(url);
  return {
    slug: extractChapterSlug(absoluteUrl),
    chapter: extractChapterNumber(absoluteUrl),
  };
}

function getChapterInfo(link, currentSlug = "") {
  if (!link) return null;

  const originalLink = getAbsoluteUrl(link);
  const slug = extractChapterSlug(originalLink) || currentSlug;
  const chapter = extractChapterNumber(originalLink);

  return slug && chapter
    ? {
        originalLink,
        apiLink: `/baca-chapter/${slug}/${chapter}`,
        slug,
        chapter,
      }
    : null;
}

function getDescription($) {
  const descriptionText = normalizeText($("#Description").first().text());
  if (descriptionText) return descriptionText;

  return normalizeText(
    $("p")
      .filter((_, el) => /Baca online|update di Komiku/i.test($(el).text()))
      .first()
      .text()
  );
}

function chapterSortValue(chapter) {
  const normalized = String(chapter || "").replace(/-/g, ".");
  const value = parseFloat(normalized);
  return Number.isNaN(value) ? 0 : value;
}

function getChapterUrlCandidates(slug, chapter) {
  const rawChapter = String(chapter || "").trim();
  const normalizedChapter = rawChapter.replace(/\./g, "-");
  const candidates = [rawChapter, normalizedChapter]
    .filter(Boolean)
    .filter((value, index, allValues) => allValues.indexOf(value) === index);

  return candidates.map((chapterValue) => ({
    chapterValue,
    url: `${BASE_URL}/${slug}-chapter-${chapterValue}/`,
  }));
}

async function fetchChapterHtml(slug, chapter) {
  const candidates = getChapterUrlCandidates(slug, chapter);
  let lastError;

  for (const candidate of candidates) {
    try {
      const data = await fetchHtml(candidate.url);
      return { data, chapterUrl: candidate.url, chapterValue: candidate.chapterValue };
    } catch (error) {
      lastError = error;
      if (!error.response || error.response.status !== 404) throw error;
    }
  }

  throw lastError;
}

const getBacaChapter = async (req, res) => {
  try {
    const { slug, chapter } = req.params;
    const { data, chapterUrl, chapterValue } = await fetchChapterHtml(slug, chapter);
    const $ = cheerio.load(data);

    const title =
      normalizeText($("#Judul h1").first().text()) ||
      normalizeText($("h1").first().text()) ||
      normalizeText($("meta[itemprop='name']").attr("content"));
    const mangaTitleElement = $(
      '#Judul a[href*="/manga/"], a[href*="/manga/"]'
    ).first();
    const mangaTitle =
      normalizeText(mangaTitleElement.find("b").first().text()) ||
      normalizeText(mangaTitleElement.text()) ||
      normalizeText(mangaTitleElement.attr("title"));
    const mangaLink = getAbsoluteUrl(mangaTitleElement.attr("href"));
    const mangaSlug = extractMangaSlug(mangaLink);

    const chapterInfo = {};
    $("#Judul table tr, table.tbl tr").each((_, el) => {
      const cells = $(el).find("td, th");
      const key = normalizeText(cells.first().text()).replace(/:$/, "");
      const value = normalizeText(cells.last().text());
      if (key && value && key !== value) chapterInfo[key] = value;
    });

    const images = [];
    $("#Baca_Komik img, img.ww, img[id]").each((_, el) => {
      const img = $(el);
      const src = getImageUrl($, img);
      const id = normalizeText(img.attr("id"));

      if (
        src &&
        /(?:img|cdn|komiku)\.komiku\.org\/upload/i.test(src) &&
        (!id || /^\d+$/.test(id))
      ) {
        images.push({
          src,
          alt: normalizeText(img.attr("alt")),
          id,
          fallbackSrc: src.replace("cdn.komiku.org", "img.komiku.org"),
        });
      }
    });

    const uniqueImages = images.filter(
      (image, index, allImages) =>
        image.src && allImages.findIndex((item) => item.src === image.src) === index
    );

    const navigationLinks = $("#Judul")
      .parent()
      .find('a[href*="chapter"]')
      .toArray()
      .map((el) => getAbsoluteUrl($(el).attr("href")))
      .filter(Boolean);

    const currentChapterNumber = chapterSortValue(chapterValue);
    const chapterCandidates = [
      ...new Set(
        navigationLinks.filter(
          (link) =>
            extractChapterSlug(link) === slug &&
            extractChapterNumber(link) !== String(chapterValue)
        )
      ),
    ];

    const prevLink =
      chapterCandidates
        .filter((link) => chapterSortValue(extractChapterNumber(link)) < currentChapterNumber)
        .sort(
          (a, b) =>
            chapterSortValue(extractChapterNumber(b)) -
            chapterSortValue(extractChapterNumber(a))
        )[0] || "";
    const nextLink =
      chapterCandidates
        .filter((link) => chapterSortValue(extractChapterNumber(link)) > currentChapterNumber)
        .sort(
          (a, b) =>
            chapterSortValue(extractChapterNumber(a)) -
            chapterSortValue(extractChapterNumber(b))
        )[0] || "";

    const chapterValueInfo =
      extractChapterNumber(chapterUrl) ||
      $(".chapterInfo").attr("valuechapter") ||
      chapterValue;
    const totalImages =
      $(".chapterInfo").attr("valuegambar") || uniqueImages.length.toString();
    const viewAnalyticsUrl = $(".chapterInfo").attr("valueview") || "";
    const additionalDescription = normalizeText($("#Komentar p").first().text());
    const publishDate =
      $("time[property='datePublished']").attr("datetime") ||
      $("meta[itemprop='datePublished']").attr("content") ||
      normalizeText($("time").first().text());

    if (!title || !uniqueImages.length) {
      logEmptyParse("GET /baca-chapter", data, {
        target: chapterUrl,
        titleFound: !!title,
        imagesFound: uniqueImages.length,
        selectors: "#Judul h1, #Baca_Komik img, img.ww",
      });

      return res.status(502).json({
        error: "Gagal parsing data chapter komik dari Komiku.",
        detail:
          "Struktur HTML chapter kemungkinan berubah atau gambar chapter kosong.",
      });
    }

    res.json({
      title,
      mangaInfo: {
        title: mangaTitle,
        originalLink: mangaLink,
        apiLink: mangaSlug ? `/detail-komik/${mangaSlug}` : null,
        slug: mangaSlug,
      },
      description: getDescription($),
      chapterInfo,
      images: uniqueImages,
      meta: {
        chapterNumber: chapterValueInfo,
        totalImages: parseInt(totalImages, 10) || 0,
        publishDate,
        viewAnalyticsUrl,
        slug,
      },
      navigation: {
        prevChapter: getChapterInfo(prevLink, slug),
        nextChapter: getChapterInfo(nextLink, slug),
        allChapters: mangaSlug ? `/detail-komik/${mangaSlug}` : null,
      },
      additionalDescription,
    });
  } catch (err) {
    console.error("Error fetching chapter:", err);
    res.status(500).json({
      error: "Gagal mengambil data chapter komik",
      detail: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

module.exports = { getBacaChapter, extractSlugAndChapter };
