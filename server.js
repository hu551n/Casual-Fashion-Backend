const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db.config");
const globalErrorHandler = require("./middlewares/error.middleware");
const rateLimit = require("./middlewares/rateLimit.middleware");
const AppError = require("./utils/appError");
const path = require("path");

dotenv.config();

connectDB();

require("./models/subcategory.model");

const app = express();

const allowedOrigins = [
  "http://localhost:4200",
  "http://127.0.0.1:4200",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));


if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/v1/auth/login", rateLimit);
app.use("/api/v1/auth/signup", rateLimit);
app.use("/api/v1/auth/forgot-password", rateLimit);
app.use("/api/v1/auth/reset-password", rateLimit);

app.use("/api/v1/auth", require("./routes/auth.route"));
app.use("/api/v1/user", require("./routes/user.route"));
app.use("/api/v1/products", require("./routes/product.route"));
app.use("/api/v1/categories", require("./routes/category.route"));
app.use("/api/v1/cart", require("./routes/cart.route"));
app.use("/api/v1/orders", require("./routes/order.route"));
app.use("/api/v1/testimonials", require("./routes/testimonial.route"));
app.use("/api/v1/reports", require("./routes/report.route"));
app.use("/api/v1/sliders", require("./routes/slider.route"));

app.get("/", (req, res) => {
  res.json({ message: "Welcome to Casual Fashion API" });
});

app.use((req, res, next) => {
  next(
    new AppError(`المسار ${req.originalUrl} غير موجود على هذا السيرفر!`, 404),
  );
});

app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on PORT ${PORT}`);
});
