const express = require("express");
const router = express.Router();
const { getSearch } = require("../controllers/searchController");

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Mencari manga berdasarkan kata kunci
 *     description: Endpoint ini digunakan untuk mencari manga, manhwa, atau manhua berdasarkan judul atau kata kunci tertentu.
 *     tags:
 *       - Search
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Kata kunci pencarian untuk mencari manga
 *         example: "one"
 *     responses:
 *       200:
 *         description: Hasil pencarian berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   description: Status keberhasilan pencarian
 *                   example: true
 *                 message:
 *                   type: string
 *                   description: Pesan response
 *                   example: "Berhasil mendapatkan hasil pencarian"
 *                 keyword:
 *                   type: string
 *                   description: Kata kunci yang digunakan untuk pencarian
 *                   example: "\"one\""
 *                 url:
 *                   type: string
 *                   description: URL pencarian di situs asli
 *                   example: "https://komiku.org/?s=%22one%22&post_type=manga"
 *                 total:
 *                   type: integer
 *                   description: Jumlah hasil yang ditemukan
 *                   example: 10
 *                 data:
 *                   type: array
 *                   description: Array berisi hasil pencarian manga
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         description: Judul manga
 *                         example: "The Villainess Is a Marionette"
 *                       altTitle:
 *                         type: string
 *                         nullable: true
 *                         description: Judul alternatif manga
 *                         example: null
 *                       slug:
 *                         type: string
 *                         description: URL slug manga
 *                         example: "the-villainess-is-a-marionette"
 *                       href:
 *                         type: string
 *                         description: Link API untuk detail manga
 *                         example: "/detail-komik/the-villainess-is-a-marionette/"
 *                       thumbnail:
 *                         type: string
 *                         description: URL gambar thumbnail manga
 *                         example: "https://thumbnail.komiku.org/img/upload/the_villainess_is_a_marionette/img_6911b2bee1c285.32720615.jpg?resize=450,235&quality=60"
 *                       type:
 *                         type: string
 *                         description: Jenis publikasi (Manga, Manhwa, Manhua)
 *                         example: "Manhwa"
 *                       genre:
 *                         type: string
 *                         description: Genre utama manga
 *                         example: "Drama"
 *                       description:
 *                         type: string
 *                         description: Deskripsi singkat atau info update terakhir
 *                         example: "Update 1 minggu lalu."
 *             example:
 *               status: true
 *               message: "Berhasil mendapatkan hasil pencarian"
 *               keyword: "\"one\""
 *               url: "https://komiku.org/?s=%22one%22&post_type=manga"
 *               total: 10
 *               data:
 *                 - title: "The Villainess Is a Marionette"
 *                   altTitle: null
 *                   slug: "the-villainess-is-a-marionette"
 *                   href: "/detail-komik/the-villainess-is-a-marionette/"
 *                   thumbnail: "https://thumbnail.komiku.org/img/upload/the_villainess_is_a_marionette/img_6911b2bee1c285.32720615.jpg?resize=450,235&quality=60"
 *                   type: "Manhwa"
 *                   genre: "Drama"
 *                   description: "Update 1 minggu lalu."
 *                 - title: "None of These Witches Are Serious"
 *                   altTitle: null
 *                   slug: "none-of-these-witches-are-serious"
 *                   href: "/detail-komik/none-of-these-witches-are-serious/"
 *                   thumbnail: "https://thumbnail.komiku.org/img/upload/none_of_these_witches_are_serious/img_690ef62a7e1397.40929442.jpg?resize=450,235&quality=60"
 *                   type: "Manhua"
 *                   genre: "Fantasi"
 *                   description: "Update 2 minggu lalu."
 *                 - title: "One of a Kind Irregular"
 *                   altTitle: null
 *                   slug: "one-of-a-kind-irregular"
 *                   href: "/detail-komik/one-of-a-kind-irregular/"
 *                   thumbnail: "https://thumbnail.komiku.org/img/upload/one_of_a_kind_irregular/img_686cb19ee0e9f1.03598001.jpg?resize=450,235&quality=60"
 *                   type: "Manhwa"
 *                   genre: "Fantasi"
 *                   description: "Update 3 bulan lalu."
 *       400:
 *         description: Parameter pencarian tidak valid atau kosong
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Parameter pencarian 'q' diperlukan"
 *                 data:
 *                   type: array
 *                   example: []
 *       404:
 *         description: Tidak ada hasil yang ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Tidak ada hasil yang ditemukan"
 *                 keyword:
 *                   type: string
 *                   example: "\"keyword\""
 *                 total:
 *                   type: integer
 *                   example: 0
 *                 data:
 *                   type: array
 *                   example: []
 *       500:
 *         description: Error server internal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to search manga"
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */

router.get("/", getSearch);

module.exports = router;
