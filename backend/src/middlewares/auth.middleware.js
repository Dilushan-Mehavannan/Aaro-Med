import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '30e75a39ed8ae4e2eac68bc3fdbf7fee4e0821c3fc15e6fb7f362c951cf55dea';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
