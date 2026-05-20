const express = require("express");
const cartController = require("../controllers/cart.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware.protect);

router.get("/", cartController.getCart);
router.post("/cart-items/:slug", cartController.addToCart);
router.post("/sync", cartController.syncCart);
router.delete("/item/:itemId", cartController.removeFromCart);

module.exports = router;
