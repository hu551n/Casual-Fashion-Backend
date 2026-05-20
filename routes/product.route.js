const express = require("express");
const productController = require("../controllers/product.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

const router = express.Router();

router.get("/", productController.getAllProducts);
router.get("/:slug", productController.getProduct);

router.use(authMiddleware.protect, authMiddleware.restrictTo("admin"));

router.get("/admin/deleted", productController.getDeletedProducts);
router.patch("/admin/:id/restore", productController.restoreProduct);

router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  productController.createProduct,
);

router.patch(
  "/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  productController.updateProduct,
);

router.delete("/:id", productController.deleteProduct);

module.exports = router;
