const express = require("express");
const router = express.Router();
const { getRekomendasi } = require("../controllers/rekomendasiController");

/**
 * @swagger
 * /rekomendasi:
 *   get:
 *     summary: Get manga recommendations
 *     description: Retrieve a list of recommended manga with their details
 *     responses:
 *       200:
 *         description: Successfully retrieved manga recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                     description: The title of the manga
 *                     example: "Kimetsu no Yaiba"
 *                   originalLink:
 *                     type: string
 *                     description: Original link to the manga on komiku.org
 *                     example: "https://komiku.org/manga/kimetsu-no-yaiba-indonesia/"
 *                   apiDetailLink:
 *                     type: string
 *                     description: API endpoint for manga details
 *                     example: "/detail-komik/kimetsu-no-yaiba-indonesia"
 *                   thumbnail:
 *                     type: string
 *                     description: Thumbnail image URL for the manga
 *                     example: "https://thumbnail.komiku.org/uploads/manga/kimetsu-no-yaiba-indonesia/manga_thumbnail-Komik-Kimetsu-no-Yaiba.jpg?resize=240,150"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */

router.get("/", getRekomendasi);

module.exports = router;
