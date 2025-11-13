const express = require("express");
const router = express.Router();
const {
  genreRekomendasi,
} = require("../controllers/genreRekomendasiController");

router.get("/", genreRekomendasi);

module.exports = router;
