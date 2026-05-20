const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "اسم القسم مطلوب"],
      unique: true,
    },

    isActive: {
      type: String,
      enum: ["summer", "winter", "always"],
      default: "always",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

categorySchema.pre(/^find/, function () {
  this.find({ isDeleted: { $ne: true } });
});

module.exports = mongoose.model("Category", categorySchema);
