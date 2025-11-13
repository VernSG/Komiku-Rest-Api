const express = require("express");
const router = express.Router();
const { getGenreAll } = require("../controllers/genreAllController");

router.get("/", getGenreAll);

module.exports = router;
