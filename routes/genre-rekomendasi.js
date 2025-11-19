const express = require("express");
const router = express.Router();
const {
  genreRekomendasi,
} = require("../controllers/genreRekomendasiController");

/**
 * @swagger
 * /genre-rekomendasi:
 *   get:
 *     summary: Mengambil daftar rekomendasi genre
 *     description: Endpoint ini mengembalikan daftar rekomendasi genre populer yang tersedia di situs Komiku, termasuk Isekai, Fantasy, Romance, dll.
 *     tags:
 *       - Genre
 *     responses:
 *       200:
 *         description: Daftar rekomendasi genre berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                     description: Nama genre
 *                     example: "Isekai"
 *                   slug:
 *                     type: string
 *                     description: Slug untuk genre (digunakan dalam URL)
 *                     example: "isekai"
 *                   originalLink:
 *                     type: string
 *                     description: Link asli ke halaman genre di situs Komiku
 *                     example: "https://komiku.org/genre/isekai"
 *                   readLink:
 *                     type: string
 *                     description: Link untuk membaca manga genre ini
 *                     example: "https://komiku.org/genre/isekai"
 *                   apiGenreLink:
 *                     type: string
 *                     description: Link API untuk mengakses genre ini
 *                     example: "/genre/isekai"
 *                   thumbnail:
 *                     type: string
 *                     description: URL gambar thumbnail untuk genre
 *                     example: "https://komiku.org/asset/img/isekai.jpg"
 *             example:
 *               - title: "Isekai"
 *                 slug: "isekai"
 *                 originalLink: "https://komiku.org/genre/isekai"
 *                 readLink: "https://komiku.org/genre/isekai"
 *                 apiGenreLink: "/genre/isekai"
 *                 thumbnail: "https://komiku.org/asset/img/isekai.jpg"
 *               - title: "Fantasi"
 *                 slug: "fantasy"
 *                 originalLink: "https://komiku.org/genre/fantasy"
 *                 readLink: "https://komiku.org/genre/fantasy"
 *                 apiGenreLink: "/genre/fantasy"
 *                 thumbnail: "https://komiku.org/asset/img/fantasy.png"
 *               - title: "Ecchi"
 *                 slug: "ecchi"
 *                 originalLink: "https://komiku.org/genre/ecchi"
 *                 readLink: "https://komiku.org/genre/ecchi"
 *                 apiGenreLink: "/genre/ecchi"
 *                 thumbnail: "https://komiku.org/asset/img/ecchi.jpg"
 *               - title: "Romantis"
 *                 slug: "romance"
 *                 originalLink: "https://komiku.org/genre/romance"
 *                 readLink: "https://komiku.org/genre/romance"
 *                 apiGenreLink: "/genre/romance"
 *                 thumbnail: "https://komiku.org/asset/img/Romantis.png"
 *               - title: "Berwarna"
 *                 slug: "berwarna"
 *                 originalLink: "https://komiku.org/other/berwarna/"
 *                 readLink: "https://komiku.org/other/berwarna/"
 *                 apiGenreLink: "/genre/berwarna"
 *                 thumbnail: "https://komiku.org/asset/img/full-color.jpg"
 *               - title: "Tamat"
 *                 slug: "end"
 *                 originalLink: "https://komiku.org/statusmanga/end/"
 *                 readLink: "https://komiku.org/statusmanga/end/"
 *                 apiGenreLink: "/genre/end"
 *                 thumbnail: "https://komiku.org/asset/img/Tamat.png"
 *       500:
 *         description: Error server internal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to fetch genre recommendations"
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */

router.get("/", genreRekomendasi);

module.exports = router;
