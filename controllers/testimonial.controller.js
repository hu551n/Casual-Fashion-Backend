const Testimonial = require("../models/testimonial.model");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.submitTestimonial = catchAsync(async (req, res, next) => {
  const { comment, rating } = req.body;
  const testimonial = await Testimonial.create({
    userId: req.user._id,
    comment,
    rating: rating || 5,
    status: 2,
  });

  res.status(201).json({ status: "success", data: { testimonial } });
});

exports.moderateTestimonial = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const testimonial = await Testimonial.findByIdAndUpdate(
    req.params.id,
    {
      status,
      isApproved: status === 1,
    },
    { new: true },
  );

  if (!testimonial) return next(new AppError("التقييم غير موجود", 404));
  res.status(200).json({ status: "success", data: { testimonial } });
});

exports.getApprovedTestimonials = catchAsync(async (req, res, next) => {
  const testimonials = await Testimonial.find({ status: 1 })
    .populate("userId", "name")
    .sort("-createdAt");

  res
    .status(200)
    .json({
      status: "success",
      results: testimonials.length,
      data: { testimonials },
    });
});

exports.getAllTestimonials = catchAsync(async (req, res, next) => {
  const queryObj = { ...req.query };
  const excludedFields = ["page", "sort", "limit", "fields"];
  excludedFields.forEach((el) => delete queryObj[el]);

  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  let query = Testimonial.find(JSON.parse(queryStr)).populate(
    "userId",
    "name mobile",
  );

  if (req.query.sort) {
    query = query.sort(req.query.sort.split(",").join(" "));
  } else {
    query = query.sort("-createdAt");
  }

  const testimonials = await query;
  res
    .status(200)
    .json({
      status: "success",
      results: testimonials.length,
      data: { testimonials },
    });
});
