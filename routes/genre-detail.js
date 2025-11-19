const express = require("express");
const router = express.Router();
const { handleGenreRequest } = require("../controllers/genreDetailController");

/**
 * @swagger
 * /genre/{slug}:
 *   get:
 *     summary: Mengambil daftar manga berdasarkan genre (halaman 1)
 *     description: Endpoint ini mengembalikan daftar manga berdasarkan genre tertentu pada halaman pertama.
 *     tags:
 *       - Genre
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Slug genre (contoh action, romance, fantasy, dll)
 *         example: action
 *     responses:
 *       200:
 *         description: Daftar manga berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 genre:
 *                   type: string
 *                   example: "action"
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalManga:
 *                   type: integer
 *                   example: 10
 *                 hasNextPage:
 *                   type: boolean
 *                   example: true
 *                 nextPageUrl:
 *                   type: string
 *                   example: "/genre/action/page/2"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: "The Rebirth of the Hero's Party's Archmage"
 *                       slug:
 *                         type: string
 *                         example: "the-rebirth-of-the-heros-partys-archmage"
 *                       type:
 *                         type: string
 *                         example: "Manga"
 *                       genre:
 *                         type: string
 *                         example: "Fantasi"
 *                       thumbnail:
 *                         type: string
 *                         example: "https://thumbnail.komiku.org/uploads/manga/the-rebirth-of-the-heros-partys-archmage/manga_img_horizontal-A1-The-Rebirth-of-the-Heros-Partys-Archmage.jpg?resize=450,235&quality=60"
 *                       description:
 *                         type: string
 *                         example: "Pertarungan melawan masa lalu dan masa depan menjadi fokus Mage Agung yang kembali hadir."
 *                       additionalInfo:
 *                         type: string
 *                         example: "1.8jt x • 14 menit • Berwarna"
 *                       updateStatus:
 *                         type: string
 *                         example: "Up 1"
 *                       apiMangaLink:
 *                         type: string
 *                         example: "/detail-komik/the-rebirth-of-the-heros-partys-archmage"
 *                       chapters:
 *                         type: object
 *                         properties:
 *                           first:
 *                             type: object
 *                             properties:
 *                               chapter:
 *                                 type: string
 *                                 example: "Chapter 00.1"
 *                               link:
 *                                 type: string
 *                                 example: "https://komiku.org/the-rebirth-of-the-heros-partys-archmage-chapter-00-1/"
 *                               apiLink:
 *                                 type: string
 *                                 example: "/chapter/the-rebirth-of-the-heros-partys-archmage-chapter-00-1/"
 *                           latest:
 *                             type: object
 *                             properties:
 *                               chapter:
 *                                 type: string
 *                                 example: "Chapter 107"
 *                               link:
 *                                 type: string
 *                                 example: "https://mangaverse.my.id/the-rebirth-of-the-heros-partys-archmage-chapter-107/"
 *                               apiLink:
 *                                 type: string
 *                                 example: "/baca-chapter/the-rebirth-of-the-heros-partys-archmage/107"
 *                 debug:
 *                   type: object
 *                   properties:
 *                     targetUrl:
 *                       type: string
 *                       example: "https://api.komiku.org/genre/action/page/1/"
 *                     elementsFound:
 *                       type: integer
 *                       example: 10
 *                     pageTitle:
 *                       type: string
 *                       example: ""
 *
 * /genre/{slug}/page/{page}:
 *   get:
 *     summary: Mengambil daftar manga berdasarkan genre dengan pagination
 *     description: Endpoint ini mengembalikan daftar manga berdasarkan genre tertentu pada halaman yang ditentukan.
 *     tags:
 *       - Genre
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Slug genre (contoh action, romance, fantasy, dll)
 *         example: action
 *       - in: path
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Nomor halaman yang ingin diambil
 *         example: 2
 *     responses:
 *       200:
 *         description: Daftar manga berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 genre:
 *                   type: string
 *                   example: "action"
 *                 currentPage:
 *                   type: integer
 *                   example: 2
 *                 totalManga:
 *                   type: integer
 *                   example: 10
 *                 hasNextPage:
 *                   type: boolean
 *                   example: true
 *                 nextPageUrl:
 *                   type: string
 *                   example: "/genre/action/page/3"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: "The Tale of the Skeleton Messenger"
 *                       slug:
 *                         type: string
 *                         example: "the-tale-of-the-skeleton-messenger"
 *                       type:
 *                         type: string
 *                         example: "Manhwa"
 *                       genre:
 *                         type: string
 *                         example: "Fantasi"
 *                       thumbnail:
 *                         type: string
 *                         example: "https://thumbnail.komiku.org/img/upload/the_tale_of_the_skeleton_messenger/img_68d8338c97b405.94994931.jpg?resize=450,235&quality=60"
 *                       description:
 *                         type: string
 *                         example: "Utusan kerangka menghadapi tantangan untuk menyampaikan pesan penting."
 *                       additionalInfo:
 *                         type: string
 *                         example: "11rb x • 6 jam • Berwarna"
 *                       updateStatus:
 *                         type: string
 *                         example: "Up 1"
 *                       apiMangaLink:
 *                         type: string
 *                         example: "/detail-komik/the-tale-of-the-skeleton-messenger"
 *                       chapters:
 *                         type: object
 *                         properties:
 *                           first:
 *                             type: object
 *                             properties:
 *                               chapter:
 *                                 type: string
 *                                 example: "Chapter 1"
 *                               link:
 *                                 type: string
 *                                 example: "https://komiku.org/the-tale-of-the-skeleton-messenger-chapter-1/"
 *                               apiLink:
 *                                 type: string
 *                                 example: "/chapter/the-tale-of-the-skeleton-messenger-chapter-1/"
 *                           latest:
 *                             type: object
 *                             properties:
 *                               chapter:
 *                                 type: string
 *                                 example: "Chapter 11"
 *                               link:
 *                                 type: string
 *                                 example: "https://mangaverse.my.id/the-tale-of-the-skeleton-messenger-chapter-11/"
 *                               apiLink:
 *                                 type: string
 *                                 example: "/baca-chapter/the-tale-of-the-skeleton-messenger/11"
 *                 debug:
 *                   type: object
 *                   properties:
 *                     targetUrl:
 *                       type: string
 *                       example: "https://api.komiku.org/genre/action/page/2/"
 *                     elementsFound:
 *                       type: integer
 *                       example: 10
 *                     pageTitle:
 *                       type: string
 *                       example: ""
 *
 * /genre/{slug}/{page}:
 *   get:
 *     summary: Mengambil daftar manga berdasarkan genre dengan pagination (backward compatibility)
 *     description: Endpoint ini mengembalikan daftar manga berdasarkan genre tertentu pada halaman yang ditentukan. Route ini disediakan untuk kompatibilitas dengan versi lama API.
 *     tags:
 *       - Genre
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Slug genre (contoh action, romance, fantasy, dll)
 *         example: action
 *       - in: path
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Nomor halaman yang ingin diambil
 *         example: 2
 *     responses:
 *       200:
 *         description: Daftar manga berhasil diambil (sama dengan /genre/{slug}/page/{page})
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenreResponse'
 *     deprecated: true
 */

router.get("/:slug", async (req, res) => {
  req.params.page = "1";
  return handleGenreRequest(req, res);
});

// GET /genre/:slug/page/:page - Route untuk pagination yang benar
router.get("/:slug/page/:page", async (req, res) => {
  return handleGenreRequest(req, res);
});

// GET /genre/:slug/:page - Backward compatibility
router.get("/:slug/:page", async (req, res) => {
  return handleGenreRequest(req, res);
});

module.exports = router;
