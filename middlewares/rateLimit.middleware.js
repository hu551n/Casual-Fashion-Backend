const requests = new Map();

const rateLimitWindow = 15 * 60 * 1000;
const maxRequests = 100;

const rateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const key = `${ip}-${req.path}`;

  const now = Date.now();
  if (!requests.has(key)) {
    requests.set(key, []);
  }

  const timestamps = requests.get(key);
  const recentRequests = timestamps.filter(
    (time) => now - time < rateLimitWindow,
  );
  if (recentRequests.length >= maxRequests) {
    return res.status(429).json({
      status: "error",
      message: "محاولات كثيرة جداً. يرجى الانتظار 15 دقيقة والمحاولة مرة أخرى.",
    });
  }
  recentRequests.push(now);
  requests.set(key, recentRequests);

  next();
};

module.exports = rateLimit;
