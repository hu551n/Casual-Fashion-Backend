const multer = require("multer");
const AppError = require("../utils/appError");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    let ext = file.mimetype.split("/")[1];
    if (ext === "svg+xml") ext = "svg";

    cb(null, `product-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/jfif",
    "image/png",
    "image/webp",
    "image/svg+xml",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "امتداد الملف غير مدعوم! المسموح به: JPG, JPEG, JFIF, PNG, WEBP, SVG فقط.",
        400,
      ),
      false,
    );
  }
};

const upload = multer({
  storage: storage,

  fileFilter: fileFilter,
});

module.exports = upload;
