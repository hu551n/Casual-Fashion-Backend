const express = require("express");
const orderController = require("../controllers/order.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware.protect);

router.get("/my-orders", orderController.getMyOrders);
router.get(
  "/all",
  authMiddleware.restrictTo("admin"),
  orderController.getAllOrders,
);
router.get("/:id", orderController.getOrder);
router.post("/", orderController.createOrder);
router.patch("/:id/status", orderController.updateOrderStatus);
router.post("/:id/refund", orderController.requestRefund);

router.use(authMiddleware.restrictTo("admin"));
router.patch("/:id/refund-admin", orderController.handleRefundAdmin);

module.exports = router;
