const express = require("express");
const router = express.Router();
const {
  komikPopuler,
  rekomendasiManga,
  rekomendasiManhwa,
  rekomendasiManhua,
} = require("../controllers/komikPopulerController");

/**
 * @swagger
 * /komik-populer:
 *   get:
 *     summary: Get popular comics by category
 *     description: Returns popular manga, manhwa, and manhua with their details
 *     tags:
 *       - Comics
 *     responses:
 *       200:
 *         description: Successfully retrieved popular comics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 manga:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: "Manga Populer"
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                           originalLink:
 *                             type: string
 *                           apiDetailLink:
 *                             type: string
 *                           thumbnail:
 *                             type: string
 *                           genre:
 *                             type: string
 *                           readers:
 *                             type: string
 *                           latestChapter:
 *                             type: string
 *                           originalChapterLink:
 *                             type: string
 *                           apiChapterLink:
 *                             type: string
 *                           mangaSlug:
 *                             type: string
 *                           chapterNumber:
 *                             type: string
 *                 manhwa:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: "Manhwa Populer"
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                           originalLink:
 *                             type: string
 *                           apiDetailLink:
 *                             type: string
 *                           thumbnail:
 *                             type: string
 *                           genre:
 *                             type: string
 *                           readers:
 *                             type: string
 *                           latestChapter:
 *                             type: string
 *                           originalChapterLink:
 *                             type: string
 *                           apiChapterLink:
 *                             type: string
 *                           mangaSlug:
 *                             type: string
 *                           chapterNumber:
 *                             type: string
 *                 manhua:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: "Manhua Populer"
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                           originalLink:
 *                             type: string
 *                           apiDetailLink:
 *                             type: string
 *                           thumbnail:
 *                             type: string
 *                           genre:
 *                             type: string
 *                           readers:
 *                             type: string
 *                           latestChapter:
 *                             type: string
 *                           originalChapterLink:
 *                             type: string
 *                           apiChapterLink:
 *                             type: string
 *                           mangaSlug:
 *                             type: string
 *                           chapterNumber:
 *                             type: string
 */
router.get("/", komikPopuler);
router.get("/manga", rekomendasiManga);
router.get("/manhwa", rekomendasiManhwa);
router.get("/manhua", rekomendasiManhua);

module.exports = router;
