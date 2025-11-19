const express = require("express");
const { getTerbaru } = require("../controllers/terbaruControllers");
const router = express.Router();

/**
 * @swagger
 * /terbaru:
 *   get:
 *     summary: Mengambil daftar komik terbaru
 *     description: Endpoint ini mengembalikan daftar komik terbaru yang ditambahkan ke situs Komiku.
 *     responses:
 *       200:
 *         description: Daftar komik terbaru berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                     example: "The Rebirth of the Hero's Party's Archmage"
 *                   originalLink:
 *                     type: string
 *                     example: "https://komiku.org/manga/the-rebirth-of-the-heros-partys-archmage/"
 *                   thumbnail:
 *                     type: string
 *                     example: "https://thumbnail.komiku.org/uploads/manga/the-rebirth-of-the-heros-partys-archmage/manga_img_horizontal-A1-The-Rebirth-of-the-Heros-Partys-Archmage.jpg?resize=240,171"
 *                   type:
 *                     type: string
 *                     example: "Manga"
 *                   genre:
 *                     type: string
 *                     example: "Fantasi"
 *                   updateTime:
 *                     type: string
 *                     example: "39 menit lalu"
 *                   latestChapterTitle:
 *                     type: string
 *                     example: "Chapter 107"
 *                   latestChapterLink:
 *                     type: string
 *                     example: "https://komiku.org/the-rebirth-of-the-heros-partys-archmage-chapter-107/"
 *                   isColored:
 *                     type: boolean
 *                     example: true
 *                   updateCountText:
 *                     type: string
 *                     example: "Up 1"
 *                   mangaSlug:
 *                     type: string
 *                     example: "the-rebirth-of-the-heros-partys-archmage"
 *                   apiDetailLink:
 *                     type: string
 *                     example: "/detail-komik/the-rebirth-of-the-heros-partys-archmage"
 *                   apiChapterLink:
 *                     type: string
 *                     nullable: true
 *                     example: "/baca-chapter/the-rebirth-of-the-heros-partys-archmage/107"
 *       500:
 *         description: Terjadi kesalahan pada server
 */

router.get("/", getTerbaru);

module.exports = router;
