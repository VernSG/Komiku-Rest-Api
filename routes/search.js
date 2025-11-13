const express = require("express");
const router = express.Router();
const { getSearch } = require("../controllers/searchController");

router.get("/", getSearch);

module.exports = router;
