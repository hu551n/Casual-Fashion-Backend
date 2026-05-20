const Slider = require("../models/slider.model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getSliders = catchAsync(async (req, res, next) => {
  const sliders = await Slider.find({ isActive: true });
  res.status(200).json({ status: "success", data: { sliders } });
});

exports.createSlider = catchAsync(async (req, res, next) => {
  if (req.file) req.body.image = req.file.filename;
  const slider = await Slider.create(req.body);
  res.status(201).json({ status: "success", data: { slider } });
});

exports.deleteSlider = catchAsync(async (req, res, next) => {
  const slider = await Slider.findByIdAndDelete(req.params.id);
  if (!slider) return next(new AppError("السلايدر غير موجود", 404));
  res.status(204).json({ status: "success", data: null });
});
