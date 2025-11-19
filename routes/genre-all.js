const express = require("express");
const router = express.Router();
const { getGenreAll } = require("../controllers/genreAllController");

/**
 * @swagger
 * /genre-all:
 *   get:
 *     summary: Mengambil daftar semua genre komik
 *     description: Endpoint ini mengembalikan daftar semua genre komik yang tersedia di situs Komiku.
 *     responses:
 *       200:
 *         description: Daftar genre komik berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                     example: "Action (3.552)"
 *                   slug:
 *                     type: string
 *                     example: "action"
 *                   apiGenreLink:
 *                     type: string
 *                     example: "/genre/action"
 *                   titleAttr:
 *                     type: string
 *                     example: "Komik Action"
 */

router.get("/", getGenreAll);

module.exports = router;
