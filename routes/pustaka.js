const express = require("express");
const router = express.Router();
const getPustaka = require("../controllers/pustakaController");

router.get("/", getPustaka.getPustakapage);
router.get("/page/:page", getPustaka.getPustakaPagination);

module.exports = router;
