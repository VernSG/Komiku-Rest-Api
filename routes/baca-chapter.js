const express = require("express");
const router = express.Router();
const { getBacaChapter } = require("../controllers/bacaChapterController");

router.get("/:slug/:chapter", getBacaChapter);

module.exports = router;
