const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "يجب أن ينتمي الطلب لمستخدم"],
    },

    address: {
      type: String,
      required: [true, "عنوان التوصيل مطلوب"],
    },

    phoneNumber: {
      type: String,
      required: [true, "رقم التواصل مطلوب"],
    },

    totalPrice: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "preparing",
        "shipped",
        "canceledByUser",
        "canceledByAdmin",
        "rejected",
        "received",
      ],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: ["cash"],
      default: "cash",
    },

    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        price: Number,
        quantity: Number,
        color: String,
        size: String,
      },
    ],

    refundRequest: {
      isRequested: { type: Boolean, default: false },
      reason: String,
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
    },
    deliveredAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
