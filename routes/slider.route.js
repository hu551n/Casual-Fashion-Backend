const express = require("express");
const sliderController = require("../controllers/slider.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

const router = express.Router();

router.get("/", sliderController.getSliders);

router.use(authMiddleware.protect, authMiddleware.restrictTo("admin"));
router.post("/", upload.single("image"), sliderController.createSlider);
router.delete("/:id", sliderController.deleteSlider);

module.exports = router;
