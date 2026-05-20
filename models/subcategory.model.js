const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "اسم القسم الفرعي مطلوب"],
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "القسم الفرعي يجب أن ينتمي لقسم رئيسي"],
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

subCategorySchema.pre(/^find/, function () {
  this.find({ isDeleted: { $ne: true } });
});

module.exports = mongoose.model("SubCategory", subCategorySchema);
