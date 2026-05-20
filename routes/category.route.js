const express = require("express");
const categoryController = require("../controllers/category.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", categoryController.getAllCategories);
router.get("/subs", categoryController.getAllSubCategories);

router.use(authMiddleware.protect, authMiddleware.restrictTo("admin"));
router.post("/", categoryController.createCategory);
router.patch("/:id", categoryController.updateCategory);
router.delete("/:id", categoryController.deleteCategory);

router.post("/subs", categoryController.createSubCategory);
router.patch("/subs/:id", categoryController.updateSubCategory);
router.delete("/subs/:id", categoryController.deleteSubCategory);

module.exports = router;
