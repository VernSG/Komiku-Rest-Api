const express = require("express");
const router = express.Router();
const { getRekomendasi } = require("../controllers/rekomendasiController");

router.get("/", getRekomendasi);

module.exports = router;
