const express = require("express");
const berwarnaController = require("../controllers/berwarnaController");
const router = express.Router();

router.get("/", berwarnaController.getBerwarnaList);
router.get("/page/:page", berwarnaController.getBerwarnaByPage);
module.exports = router;
