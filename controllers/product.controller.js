const Product = require("../models/product.model");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.getAllProducts = catchAsync(async (req, res, next) => {
  let filter = {};

  if (req.query.categoryName) {
    const cat = await require("../models/category.model").findOne({
      title: { $regex: req.query.categoryName, $options: "i" },
    });
    if (cat) filter.categoryId = cat._id;
  }

  if (req.query.subCategoryName) {
    const sub = await require("../models/subcategory.model").findOne({
      title: { $regex: req.query.subCategoryName, $options: "i" },
    });
    if (sub) filter.subCategoryId = sub._id;
  }

  if (req.query.name) {
    filter.name = { $regex: req.query.name, $options: "i" };
  }

  if (req.query.categoryId) {
    filter.categoryId = req.query.categoryId;
  }

  if (req.query.isActive) {
    filter.isActive = req.query.isActive;
  }

  const priceGte = req.query['price[gte]'] || (req.query.price && req.query.price.gte);
  const priceLte = req.query['price[lte]'] || (req.query.price && req.query.price.lte);

  if (priceGte !== undefined || priceLte !== undefined) {
    filter.price = {};
    if (priceGte !== undefined) filter.price.$gte = Number(priceGte);
    if (priceLte !== undefined) filter.price.$lte = Number(priceLte);
  }

  if (req.query.isNewArrival !== undefined) filter.isNewArrival = req.query.isNewArrival === 'true';
  if (req.query.isBestSeller !== undefined) filter.isBestSeller = req.query.isBestSeller === 'true';

  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 100;
  const skip = (page - 1) * limit;

  let sortBy = "-createdAt";
  if (req.query.sort) {
    sortBy = req.query.sort.split(',').join(' ');
  }

  const products = await Product.find(filter)
    .populate("categoryId subCategoryId")
    .sort(sortBy)
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: "success",
    results: products.length,
    page,
    data: { products },
  });
});

exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({ slug: req.params.slug }).populate(
    "categoryId subCategoryId",
  );

  if (!product) {
    return next(new AppError("لا يوجد منتج بهذا الرابط", 404));
  }

  res.status(200).json({
    status: "success",
    data: { product },
  });
});

exports.createProduct = catchAsync(async (req, res, next) => {
  if (req.files) {
    if (req.files.image) req.body.image = req.files.image[0].filename;
    if (req.files.images)
      req.body.images = req.files.images.map((file) => file.filename);
  }

  if (req.body.variants && typeof req.body.variants === "string") {
    req.body.variants = JSON.parse(req.body.variants);
  }

  const newProduct = await Product.create(req.body);

  res.status(201).json({
    status: "success",
    data: { product: newProduct },
  });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
  if (req.files) {
    if (req.files.image) req.body.image = req.files.image[0].filename;
    if (req.files.images)
      req.body.images = req.files.images.map((file) => file.filename);
  }

  if (req.body.variants && typeof req.body.variants === "string") {
    req.body.variants = JSON.parse(req.body.variants);
  }

  if (req.body.name) {
    req.body.slug = req.body.name.toLowerCase().split(" ").join("-");
  }

  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    return next(new AppError("لا يوجد منتج بهذا الرقم التعريفي", 404));
  }

  res.status(200).json({
    status: "success",
    data: { product },
  });
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(req.params.id, {
    isDeleted: true,
  });

  if (!product) {
    return next(new AppError("لا يوجد منتج بهذا الرقم التعريفي", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getDeletedProducts = catchAsync(async (req, res, next) => {
  const products = await Product.find({ isDeleted: true })
    .setOptions({ withDeleted: true })
    .populate("categoryId subCategoryId");

  res.status(200).json({
    status: "success",
    results: products.length,
    data: {
      products,
    },
  });
});

exports.restoreProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { isDeleted: false },
    { new: true },
  ).setOptions({ withDeleted: true });

  if (!product) {
    return next(new AppError("لا يوجد منتج محذوف بهذا الرقم التعريفي", 404));
  }

  res.status(200).json({
    status: "success",
    data: { product },
  });
});
