const express = require("express");
const router = express.Router();
const { getDetail } = require("../controllers/detailKomikController");

/**
 * @swagger
 * /detail-komik/{slug}:
 *   get:
 *     summary: Get detailed information about a comic
 *     tags: [Comic]
 *     parameters:
 *       - in: path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *         description: The comic slug
 *         example: bocchi-the-rock
 *     responses:
 *       200:
 *         description: Comic detail retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 title:
 *                   type: string
 *                   example: "Komik Bocchi the Rock!"
 *                 alternativeTitle:
 *                   type: string
 *                   example: "Bocchi Si Penyendiri Musik"
 *                 description:
 *                   type: string
 *                 sinopsis:
 *                   type: string
 *                 thumbnail:
 *                   type: string
 *                   format: uri
 *                 info:
 *                   type: object
 *                   properties:
 *                     "Judul Komik":
 *                       type: string
 *                     "Judul Indonesia":
 *                       type: string
 *                     "Jenis Komik":
 *                       type: string
 *                     "Konsep Cerita":
 *                       type: string
 *                     "Pengarang":
 *                       type: string
 *                     "Status":
 *                       type: string
 *                     "Umur Pembaca":
 *                       type: string
 *                     "Cara Baca":
 *                       type: string
 *                 genres:
 *                   type: array
 *                   items:
 *                     type: string
 *                 slug:
 *                   type: string
 *                 firstChapter:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     originalLink:
 *                       type: string
 *                     apiLink:
 *                       type: string
 *                     chapterNumber:
 *                       type: string
 *                 latestChapter:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     originalLink:
 *                       type: string
 *                     apiLink:
 *                       type: string
 *                     chapterNumber:
 *                       type: string
 *                 chapters:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       originalLink:
 *                         type: string
 *                       apiLink:
 *                         type: string
 *                       views:
 *                         type: string
 *                       date:
 *                         type: string
 *                       chapterNumber:
 *                         type: string
 *                 similarKomik:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       originalLink:
 *                         type: string
 *                       apiLink:
 *                         type: string
 *                       thumbnail:
 *                         type: string
 *                       type:
 *                         type: string
 *                       genres:
 *                         type: string
 *                       synopsis:
 *                         type: string
 *                       views:
 *                         type: string
 *                       slug:
 *                         type: string
 *       404:
 *         description: Comic not found
 */

router.get("/:slug", getDetail);

module.exports = router;
