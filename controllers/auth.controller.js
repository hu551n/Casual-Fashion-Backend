const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: { user },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const { name, mobile, email, gender, password, addresses, optInEmail, role } =
    req.body;

  if (!name || !mobile || !password) {
    return next(
      new AppError("يرجى إدخال الاسم، رقم الموبايل، وكلمة السر", 400),
    );
  }

  if (password.length < 6) {
    return next(new AppError("كلمة السر يجب أن تكون 6 أحرف على الأقل", 400));
  }

  if (!/^\d{10,}$/.test(mobile.replace(/[-\s]/g, ""))) {
    return next(new AppError("يرجى إدخال رقم موبايل صحيح", 400));
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return next(new AppError("يرجى إدخال بريد إلكتروني صحيح", 400));
  }

  const existingUser = await User.findOne({ mobile });
  if (existingUser) {
    return next(new AppError("رقم الموبايل مسجل بالفعل", 400));
  }

  const newUser = await User.create({
    name,
    mobile,
    email,
    gender,
    password,
    addresses,
    optInEmail,
    role,
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { mobile, password } = req.body;

  if (!mobile || !password) {
    return next(new AppError("يرجى إدخال رقم الموبايل وكلمة السر", 400));
  }

  const user = await User.findOne({ mobile }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("رقم الموبايل أو كلمة السر غير صحيحة", 401));
  }

  createSendToken(user, 200, res);
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { mobile } = req.body;

  const user = await User.findOne({ mobile });
  if (!user) return next(new AppError("لا يوجد مستخدم مسجل بهذا الرقم", 404));

  res.status(200).json({
    status: "success",
    message: "تم إرسال كود التحقق (OTP) لهاتفك.. الكود التجريبي هو 1234",
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { mobile, otp, newPassword, confirmPassword } = req.body;

  if (!mobile || !otp || !newPassword || !confirmPassword) {
    return next(new AppError("يرجى إكمال جميع الحقول المطلوبة", 400));
  }

  if (newPassword.length < 6) {
    return next(new AppError("كلمة السر يجب أن تكون 6 أحرف على الأقل", 400));
  }

  if (newPassword !== confirmPassword) {
    return next(new AppError("كلمات السر غير متطابقة", 400));
  }

  if (otp !== "1234") return next(new AppError("كود التحقق غير صحيح", 400));

  const user = await User.findOne({ mobile });
  if (!user) return next(new AppError("المستخدم غير موجود", 404));

  user.password = newPassword;
  await user.save();

  res
    .status(200)
    .json({ status: "success", message: "تم تغيير كلمة السر بنجاح" });
});

exports.logout = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: "success",
    message: "تم تسجيل الخروج بنجاح",
    token: null,
  });
});
