function limitAttempts(limit, getKey) {
  const attempts = new Map();
  let resetAt = 0;
  const interval = 15 * 60 * 1000;

  return (req, res, next) => {
    const now = Date.now();
    if (now >= resetAt) {
      attempts.clear();
      resetAt = now + interval;
    }

    const key = getKey(req);
    const count = attempts.get(key) || 0;
    if (count >= limit || (!count && attempts.size >= 10000)) {
      res.set('Retry-After', String(Math.ceil((resetAt - now) / 1000)));
      return res.status(429).json({ message: 'Demasiados intentos. Intenta más tarde.' });
    }

    attempts.set(key, count + 1);
    next();
  };
}

module.exports = { limitAttempts };
