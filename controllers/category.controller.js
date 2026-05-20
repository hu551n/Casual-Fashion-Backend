const Category = require("../models/category.model");
const SubCategory = require("../models/subcategory.model");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.getAllCategories = catchAsync(async (req, res, next) => {
  const categories = await Category.find();
  res.status(200).json({
    status: "success",
    data: { categories },
  });
});

exports.createCategory = catchAsync(async (req, res, next) => {
  const newCategory = await Category.create(req.body);
  res.status(201).json({
    status: "success",
    data: { category: newCategory },
  });
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(req.params.id, {
    isDeleted: true,
  });
  if (!category) return next(new AppError("هذا القسم غير موجود", 404));
  res.status(204).json({ status: "success", data: null });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) return next(new AppError("هذا القسم غير موجود", 404));
  res.status(200).json({ status: "success", data: { category } });
});

exports.getAllSubCategories = catchAsync(async (req, res, next) => {
  const subs = await SubCategory.find().populate("categoryId");
  res.status(200).json({ status: "success", data: { subs } });
});

exports.createSubCategory = catchAsync(async (req, res, next) => {
  const newSub = await SubCategory.create(req.body);
  res.status(201).json({ status: "success", data: { sub: newSub } });
});

exports.updateSubCategory = catchAsync(async (req, res, next) => {
  const sub = await SubCategory.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!sub) return next(new AppError("هذا القسم الفرعي غير موجود", 404));
  res.status(200).json({ status: "success", data: { sub } });
});

exports.deleteSubCategory = catchAsync(async (req, res, next) => {
  const sub = await SubCategory.findByIdAndUpdate(req.params.id, {
    isDeleted: true,
  });
  if (!sub) return next(new AppError("هذا القسم الفرعي غير موجود", 404));
  res.status(204).json({ status: "success", data: null });
});
