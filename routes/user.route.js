const express = require("express");
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware.protect);

router.get("/profile", userController.getProfile);
router.get("/wishlist", userController.getWishlist);
router.patch("/wishlist/:productId", userController.toggleWishlist);
router.post("/address", userController.addAddress);
router.patch("/address/:addressId/default", userController.setDefaultAddress);
router.delete("/address/:addressId", userController.deleteAddress);


router.use(authMiddleware.restrictTo("admin"));
router.get("/all", userController.getAllUsers);
router.patch("/:id/status", userController.toggleUserStatus);

module.exports = router;
