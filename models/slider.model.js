const mongoose = require("mongoose");

const sliderSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: [true, "صورة السلايدر مطلوبة"],
    },

    title: String,

    description: String,

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

sliderSchema.virtual("imageUrl").get(function () {
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";
  if (this.image && !this.image.startsWith("http")) {
    return `${baseUrl}/uploads/${this.image}`;
  }
  return this.image;
});

sliderSchema.set("toJSON", { virtuals: true });
sliderSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Slider", sliderSchema);
