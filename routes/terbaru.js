const express = require("express");
const { getTerbaru } = require("../controllers/terbaruControllers");
const router = express.Router();

router.get("/", getTerbaru);

module.exports = router;
