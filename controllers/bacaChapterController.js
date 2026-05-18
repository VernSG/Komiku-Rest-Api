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

const getBacaChapter = async (req, res) => {
  try {
    const { slug, chapter } = req.params;
    const chapterUrl = `${BASE_URL}/${slug}-chapter-${chapter}/`;
    const data = await fetchHtml(chapterUrl);
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

    const currentChapterNumber = parseFloat(chapter);
    const chapterCandidates = [
      ...new Set(
        navigationLinks.filter(
          (link) =>
            extractChapterSlug(link) === slug &&
            extractChapterNumber(link) !== String(chapter)
        )
      ),
    ];

    const prevLink =
      chapterCandidates
        .filter((link) => parseFloat(extractChapterNumber(link)) < currentChapterNumber)
        .sort(
          (a, b) =>
            parseFloat(extractChapterNumber(b)) -
            parseFloat(extractChapterNumber(a))
        )[0] || "";
    const nextLink =
      chapterCandidates
        .filter((link) => parseFloat(extractChapterNumber(link)) > currentChapterNumber)
        .sort(
          (a, b) =>
            parseFloat(extractChapterNumber(a)) -
            parseFloat(extractChapterNumber(b))
        )[0] || "";

    const chapterValueInfo =
      $(".chapterInfo").attr("valuechapter") ||
      extractChapterNumber(chapterUrl) ||
      chapter;
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
