const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "اسم المنتج مطلوب"],
    },

    desc: {
      type: String,
      required: [true, "وصف المنتج مطلوب"],
    },

    price: {
      type: Number,
      required: [true, "سعر المنتج مطلوب"],
    },

    image: {
      type: String,
      required: [true, "صورة المنتج مطلوبة"],
    },

    stock: {
      type: Number,
      required: [true, "كمية المخزن مطلوبة"],
      default: 0,
    },
    variants: [
      {
        color: String,
        size: String,
        stock: { type: Number, default: 0 },
      },
    ],

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "يجب أن ينتمي المنتج لقسم رئيسي"],
    },

    subCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      required: [true, "يجب أن ينتمي المنتج لقسم فرعي"],
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

    slug: {
      type: String,
      unique: true,
    },

    isNewArrival: {
      type: Boolean,
      default: true,
    },

    isBestSeller: {
      type: Boolean,
      default: false,
    },

    images: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

productSchema.virtual("imageUrls").get(function () {
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";
  if (this.images && this.images.length > 0) {
    return this.images.map((img) => {
      if (img.startsWith("http")) return img;
      return `${baseUrl}/uploads/${img}`;
    });
  }
  return [];
});

productSchema.virtual("imageUrl").get(function () {
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";
  if (this.image && !this.image.startsWith("http")) {
    return `${baseUrl}/uploads/${this.image}`;
  }
  return this.image;
});

productSchema.pre("save", function () {
  if (!this.isModified("name")) return;

  this.slug = this.name.toLowerCase().split(" ").join("-");
});

productSchema.pre(/^find/, function () {
  if (this.getOptions().withDeleted) return;
  this.find({ isDeleted: { $ne: true } });
});

module.exports = mongoose.model("Product", productSchema);
