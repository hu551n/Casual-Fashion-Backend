const express = require("express");
const testimonialController = require("../controllers/testimonial.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/approved", testimonialController.getApprovedTestimonials);

router.use(authMiddleware.protect);
router.post("/", testimonialController.submitTestimonial);

router.use(authMiddleware.restrictTo("admin"));
router.get("/", testimonialController.getAllTestimonials);
router.patch("/:id/moderate", testimonialController.moderateTestimonial);

module.exports = router;
