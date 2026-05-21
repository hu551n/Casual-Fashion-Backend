const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.createOrder = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ userId: req.user._id }).populate(
    "items.productId",
  );

  if (!cart || cart.items.length === 0) {
    return next(new AppError("سلة التسوق فارغة", 400));
  }

  const validItems = cart.items.filter(
    (item) => item.productId && !item.isPriceChanged,
  );
  if (validItems.length === 0) {
    return next(
      new AppError("سلة التسوق فارغة أو تحتوي على منتجات غير صالحة", 400),
    );
  }

  const successfullyDeducted = [];

  try {
    for (let item of validItems) {
      if (!item.productId) continue;

      let variantDeducted = false;
      if (item.color || item.size) {
        const variantUpdate = await Product.updateOne(
          {
            _id: item.productId._id,
            "variants.color": item.color,
            "variants.size": item.size,
            "variants.stock": { $gte: item.quantity },
          },
          { $inc: { "variants.$.stock": -item.quantity } }
        );

        if (variantUpdate.modifiedCount === 0) {
          throw new Error(`اللون ${item.color} والمقاس ${item.size} من المنتج ${item.productId.name} غير متوفر بالكمية المطلوبة`);
        }
        variantDeducted = true;
      }

      const stockUpdate = await Product.updateOne(
        { _id: item.productId._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );

      if (stockUpdate.modifiedCount === 0) {
        if (variantDeducted) {
          await Product.updateOne(
            { _id: item.productId._id, "variants.color": item.color, "variants.size": item.size },
            { $inc: { "variants.$.stock": item.quantity } }
          );
        }
        throw new Error(`المنتج ${item.productId.name} غير متوفر بالكمية المطلوبة`);
      }

      successfullyDeducted.push(item);
    }
  } catch (error) {
    for (let item of successfullyDeducted) {
      await Product.updateOne({ _id: item.productId._id }, { $inc: { stock: item.quantity } });
      if (item.color || item.size) {
        await Product.updateOne(
          { _id: item.productId._id, "variants.color": item.color, "variants.size": item.size },
          { $inc: { "variants.$.stock": item.quantity } }
        );
      }
    }
    return next(new AppError(error.message, 400));
  }

  const { address, phoneNumber } = req.body;
  const totalPrice = validItems.reduce((acc, item) => acc + item.totalPrice, 0);

  try {
    const order = await Order.create({
      userId: req.user._id,
      address,
      phoneNumber,
      paymentMethod: req.body.paymentMethod || "cash",
      totalPrice,
      products: validItems.map((item) => ({
        productId: item.productId._id,
        price: item.price,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
      })),
    });

    cart.items = cart.items.filter((item) => item.isPriceChanged);
    await cart.save();

    res.status(201).json({ status: "success", data: { order } });
  } catch (error) {
    for (let item of successfullyDeducted) {
      await Product.updateOne({ _id: item.productId._id }, { $inc: { stock: item.quantity } });
      if (item.color || item.size) {
        await Product.updateOne(
          { _id: item.productId._id, "variants.color": item.color, "variants.size": item.size },
          { $inc: { "variants.$.stock": item.quantity } }
        );
      }
    }
    return next(new AppError("حدث خطأ أثناء إنشاء الطلب، يرجى المحاولة مرة أخرى", 500));
  }
});

exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(new AppError("الطلب غير موجود", 404));

    const { status } = req.body;

    if (
      req.user.role === "user" &&
      order.userId.toString() !== req.user._id.toString()
    ) {
      return next(new AppError("ليس لديك صلاحية لتعديل هذا الطلب", 403));
    }

    if (req.user.role === "user") {
      if (status === "received") {
        if (order.status !== "shipped") {
          return next(
            new AppError("لا يمكنك تأكيد استلام الطلب إلا بعد شحنه", 400),
          );
        }
      } else if (status === "canceledByUser") {
        if (!["pending", "preparing"].includes(order.status)) {
          return next(
            new AppError("لا يمكنك إلغاء الطلب بعد شحنه أو تسليمه", 400),
          );
        }
      } else {
        return next(
          new AppError("ليس لديك صلاحية لتغيير الطلب لهذه الحالة", 400),
        );
      }
    }

    const canceledStatuses = ["canceledByUser", "canceledByAdmin"];
    const isCurrentlyCanceled = canceledStatuses.includes(order.status);
    const isChangingToCanceled = canceledStatuses.includes(status);

    if (isChangingToCanceled && !isCurrentlyCanceled) {
      for (let p of order.products) {
        if (p.productId) {
          await Product.findByIdAndUpdate(p.productId, {
            $inc: { stock: p.quantity },
          });

          if (p.color || p.size) {
            await Product.updateOne(
              {
                _id: p.productId,
                "variants.color": p.color,
                "variants.size": p.size,
              },
              { $inc: { "variants.$.stock": p.quantity } },
            );
          }
        }
      }
    } else if (!isChangingToCanceled && isCurrentlyCanceled) {
      for (let p of order.products) {
        if (p.productId) {
          await Product.findByIdAndUpdate(p.productId, {
            $inc: { stock: -p.quantity },
          });

          if (p.color || p.size) {
            await Product.updateOne(
              {
                _id: p.productId,
                "variants.color": p.color,
                "variants.size": p.size,
              },
              { $inc: { "variants.$.stock": -p.quantity } },
            );
          }
        }
      }
    }

    order.status = status;
    if (status === "received") {
      order.deliveredAt = new Date();
    } else {
      order.deliveredAt = undefined;
    }
    await order.save({ validateBeforeSave: false });

    res.status(200).json({ status: "success", data: { order } });
  } catch (err) {
    return next(err);
  }
});

exports.requestRefund = catchAsync(async (req, res, next) => {
  const order = await Order.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });
  if (!order) return next(new AppError("الطلب غير موجود", 404));

  order.refundRequest = {
    isRequested: true,
    reason: req.body.reason,
    status: "pending",
  };

  await order.save();
  res.status(200).json({ status: "success", data: { order } });
});

exports.handleRefundAdmin = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  const { status } = req.body;

  const oldStatus = order.refundRequest.status;
  order.refundRequest.status = status;

  if (status === "approved" && oldStatus !== "approved") {
    for (let p of order.products) {
      if (p.productId) {
        await Product.findByIdAndUpdate(p.productId, {
          $inc: { stock: p.quantity },
        });

        if (p.color || p.size) {
          await Product.updateOne(
            {
              _id: p.productId,
              "variants.color": p.color,
              "variants.size": p.size,
            },
            { $inc: { "variants.$.stock": p.quantity } },
          );
        }
      }
    }
  } else if (status !== "approved" && oldStatus === "approved") {
    for (let p of order.products) {
      if (p.productId) {
        await Product.findByIdAndUpdate(p.productId, {
          $inc: { stock: -p.quantity },
        });

        if (p.color || p.size) {
          await Product.updateOne(
            {
              _id: p.productId,
              "variants.color": p.color,
              "variants.size": p.size,
            },
            { $inc: { "variants.$.stock": -p.quantity } },
          );
        }
      }
    }
  }

  await order.save();
  res.status(200).json({ status: "success", data: { order } });
});

exports.getMyOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find({ userId: req.user._id }).sort("-createdAt");
  res
    .status(200)
    .json({ status: "success", results: orders.length, data: { orders } });
});

exports.getOrder = catchAsync(async (req, res, next) => {
  const query =
    req.user.role === "admin"
      ? { _id: req.params.id }
      : { _id: req.params.id, userId: req.user._id };

  const order = await Order.findOne(query).populate(
    "products.productId userId",
  );
  if (!order) return next(new AppError("الطلب غير موجود", 404));
  res.status(200).json({ status: "success", data: { order } });
});

exports.getAllOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find().populate("userId products.productId").sort("-createdAt");
  res.status(200).json({ status: "success", results: orders.length, data: { orders } });
});
