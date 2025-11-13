const express = require("express");
const router = express.Router();
const {
  komikPopuler,
  rekomendasiManga,
  rekomendasiManhwa,
  rekomendasiManhua,
} = require("../controllers/komikPopulerController");

router.get("/", komikPopuler);
router.get("/manga", rekomendasiManga);
router.get("/manhwa", rekomendasiManhwa);
router.get("/manhua", rekomendasiManhua);

module.exports = router;
