const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'weekly-report-platform-secret-2026';

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증이 필요합니다.' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }
    next();
  };
}

module.exports = { authenticate, authorize, JWT_SECRET };
