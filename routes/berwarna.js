const express = require("express");
const berwarnaController = require("../controllers/berwarnaController");
const router = express.Router();

/**
 * @swagger
 * /berwarna:
 *   get:
 *     summary: Mengambil daftar komik berwarna
 *     description: Endpoint ini mengembalikan daftar komik berwarna yang tersedia di situs Komiku.
 *     responses:
 *       200:
 *         description: Daftar komik berwarna berhasil diambil
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
 *                   example: "Success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                             example: "The Rebirth of the Hero's Party's Archmage"
 *                           thumbnail:
 *                             type: string
 *                             example: "https://thumbnail.komiku.org/uploads/manga/the-rebirth-of-the-heros-partys-archmage/manga_img_horizontal-A1-The-Rebirth-of-the-Heros-Partys-Archmage.jpg?resize=450,235&quality=60"
 *                           type:
 *                             type: string
 *                             example: "Manga"
 *                           genre:
 *                             type: string
 *                             example: "Fantasi"
 *                           url:
 *                             type: string
 *                             example: "https://komiku.org/manga/the-rebirth-of-the-heros-partys-archmage/"
 *                           detailUrl:
 *                             type: string
 *                             example: "/detail-komik/the-rebirth-of-the-heros-partys-archmage"
 *                           description:
 *                             type: string
 *                             example: "Pertarungan melawan masa lalu dan masa depan menjadi fokus Mage Agung yang kembali hadir."
 *                           stats:
 *                             type: string
 *                             example: "1.8jt x • 45 menit • Berwarna"
 *                           firstChapter:
 *                             type: object
 *                             properties:
 *                               title:
 *                                 type: string
 *                                 example: "The Rebirth of the Hero's Party's Archmage Chapter 00.1"
 *                               url:
 *                                 type: string
 *                                 example: "/baca-chapter/the-rebirth-of-the-heros-partys-archmage/00"
 *                           latestChapter:
 *                             type: object
 *                             properties:
 *                               title:
 *                                 type: string
 *                                 example: "The Rebirth of the Hero's Party's Archmage Chapter 107"
 *                               url:
 *                                 type: string
 *                                 example: "/baca-chapter/the-rebirth-of-the-heros-partys-archmage/107"
 *                     total:
 *                       type: integer
 *                       example: 10
 *                     success:
 *                       type: boolean
 *                       example: true
 *
 * /berwarna/page/{page}:
 *   get:
 *     summary: Mengambil daftar komik berwarna berdasarkan halaman
 *     description: Endpoint ini mengembalikan daftar komik berwarna pada halaman tertentu.
 *     parameters:
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
 *         description: Daftar komik berwarna berhasil diambil
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
 *                   example: "Success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 2
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                             example: "The Rebirth of the Hero's Party's Archmage"
 *                           thumbnail:
 *                             type: string
 *                             example: "https://thumbnail.komiku.org/uploads/manga/the-rebirth-of-the-heros-partys-archmage/manga_img_horizontal-A1-The-Rebirth-of-the-Heros-Partys-Archmage.jpg?resize=450,235&quality=60"
 *                           type:
 *                             type: string
 *                             example: "Manga"
 *                           genre:
 *                             type: string
 *                             example: "Fantasi"
 *                           url:
 *                             type: string
 *                             example: "https://komiku.org/manga/the-rebirth-of-the-heros-partys-archmage/"
 *                           detailUrl:
 *                             type: string
 *                             example: "/detail-komik/the-rebirth-of-the-heros-partys-archmage"
 *                           description:
 *                             type: string
 *                             example: "Pertarungan melawan masa lalu dan masa depan menjadi fokus Mage Agung yang kembali hadir."
 *                           stats:
 *                             type: string
 *                             example: "1.8jt x • 45 menit • Berwarna"
 *                           firstChapter:
 *                             type: object
 *                             properties:
 *                               title:
 *                                 type: string
 *                                 example: "The Rebirth of the Hero's Party's Archmage Chapter 00.1"
 *                               url:
 *                                 type: string
 *                                 example: "/baca-chapter/the-rebirth-of-the-heros-partys-archmage/00"
 *                           latestChapter:
 *                             type: object
 *                             properties:
 *                               title:
 *                                 type: string
 *                                 example: "The Rebirth of the Hero's Party's Archmage Chapter 107"
 *                               url:
 *                                 type: string
 *                                 example: "/baca-chapter/the-rebirth-of-the-heros-partys-archmage/107"
 *                     total:
 *                       type: integer
 *                       example: 10
 *                     success:
 *                       type: boolean
 *                       example: true
 */

router.get("/", berwarnaController.getBerwarnaList);
router.get("/page/:page", berwarnaController.getBerwarnaByPage);
module.exports = router;
