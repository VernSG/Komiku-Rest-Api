const express = require("express");
const router = express.Router();
const getPustaka = require("../controllers/pustakaController");

/**
 * @swagger
 * /pustaka:
 *   get:
 *     summary: Get pustaka manga list
 *     tags: [Pustaka]
 *     responses:
 *       200:
 *         description: Successfully retrieved manga list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                   example: 1
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         description: Manga title
 *                         example: "Watashi o Tabetai, Hitodenashi"
 *                       thumbnail:
 *                         type: string
 *                         description: Manga thumbnail URL
 *                         example: "https://thumbnail.komiku.org/uploads/manga/watashi-o-tabetai-hitodenashi/manga_img_horizontal-Komik-Watashi-o-Tabetai-Hitodenashi.jpg?resize=450,235"
 *                       type:
 *                         type: string
 *                         description: Manga type (Manga, Manhwa, etc.)
 *                         example: "Manga"
 *                       genre:
 *                         type: string
 *                         description: Manga genre
 *                         example: "Drama"
 *                       url:
 *                         type: string
 *                         description: Original manga URL
 *                         example: "https://komiku.org/manga/watashi-o-tabetai-hitodenashi/"
 *                       detailUrl:
 *                         type: string
 *                         description: Detail page URL
 *                         example: "/detail-komik/watashi-o-tabetai-hitodenashi"
 *                       description:
 *                         type: string
 *                         description: Manga description
 *                         example: "Pengalaman dua jiwa yang berbeda dalam membangun hubungan tulus dan penuh tantangan."
 *                       stats:
 *                         type: string
 *                         description: Manga statistics
 *                         example: "60rb pembaca | 11 menit lalu"
 *                       firstChapter:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                             description: First chapter title
 *                             example: "Watashi o Tabetai, Hitodenashi Chapter 01"
 *                           url:
 *                             type: string
 *                             description: First chapter URL
 *                             example: "/baca-chapter/watashi-o-tabetai-hitodenashi/01"
 *                       latestChapter:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                             description: Latest chapter title
 *                             example: "Watashi o Tabetai, Hitodenashi Chapter 48.5"
 *                           url:
 *                             type: string
 *                             description: Latest chapter URL
 *                             example: "/baca-chapter/watashi-o-tabetai-hitodenashi/48"
 */

/**
 * @swagger
 * /pustaka/page/{page}:
 *   get:
 *     summary: Get pustaka manga list with pagination
 *     tags: [Pustaka]
 *     parameters:
 *       - in: path
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *         example: 1
 *     responses:
 *       200:
 *         description: Successfully retrieved manga list for specified page
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                   example: 1
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         description: Manga title
 *                         example: "Watashi o Tabetai, Hitodenashi"
 *                       thumbnail:
 *                         type: string
 *                         description: Manga thumbnail URL
 *                         example: "https://thumbnail.komiku.org/uploads/manga/watashi-o-tabetai-hitodenashi/manga_img_horizontal-Komik-Watashi-o-Tabetai-Hitodenashi.jpg?resize=450,235"
 *                       type:
 *                         type: string
 *                         description: Manga type (Manga, Manhwa, etc.)
 *                         example: "Manga"
 *                       genre:
 *                         type: string
 *                         description: Manga genre
 *                         example: "Drama"
 *                       url:
 *                         type: string
 *                         description: Original manga URL
 *                         example: "https://komiku.org/manga/watashi-o-tabetai-hitodenashi/"
 *                       detailUrl:
 *                         type: string
 *                         description: Detail page URL
 *                         example: "/detail-komik/watashi-o-tabetai-hitodenashi"
 *                       description:
 *                         type: string
 *                         description: Manga description
 *                         example: "Pengalaman dua jiwa yang berbeda dalam membangun hubungan tulus dan penuh tantangan."
 *                       stats:
 *                         type: string
 *                         description: Manga statistics
 *                         example: "60rb pembaca | 11 menit lalu"
 *                       firstChapter:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                             description: First chapter title
 *                             example: "Watashi o Tabetai, Hitodenashi Chapter 01"
 *                           url:
 *                             type: string
 *                             description: First chapter URL
 *                             example: "/baca-chapter/watashi-o-tabetai-hitodenashi/01"
 *                       latestChapter:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                             description: Latest chapter title
 *                             example: "Watashi o Tabetai, Hitodenashi Chapter 48.5"
 *                           url:
 *                             type: string
 *                             description: Latest chapter URL
 *                             example: "/baca-chapter/watashi-o-tabetai-hitodenashi/48"
 */

router.get("/", getPustaka.getPustakapage);
router.get("/page/:page", getPustaka.getPustakaPagination);

module.exports = router;
