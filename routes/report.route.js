const express = require("express");
const reportController = require("../controllers/report.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.get(
  "/sales",
  authMiddleware.protect,
  authMiddleware.restrictTo("admin"),
  reportController.getSalesReport,
);

module.exports = router;
