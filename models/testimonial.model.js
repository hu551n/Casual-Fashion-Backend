const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    comment: {
      type: String,
      required: [true, "التعليق مطلوب"],
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },

    isApproved: {
      type: Boolean,
      default: false,
    },

    status: {
      type: Number,
      enum: [1, 2, 3],
      default: 2,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Testimonial", testimonialSchema);
