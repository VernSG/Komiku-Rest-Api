const express = require("express");
const router = express.Router();
const { getDetail } = require("../controllers/detailKomikController");

router.get("/:slug", getDetail);

module.exports = router;
