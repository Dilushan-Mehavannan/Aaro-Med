export const guardPatient = (req, res, next) => {
  if (req.user?.role === 'patient') return next();
  return res.status(403).json({ message: 'Access denied: patients only' });
};

export const guardDoctor = (req, res, next) => {
  if (req.user?.role === 'doctor' || req.user?.role === 'psychiatrist') return next();
  return res.status(403).json({ message: 'Access denied: doctors only' });
};

export const guardAdmin = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ message: 'Access denied: admins only' });
};
