export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.status === 404) {
    return res.status(404).json({ error: 'Resource not found' });
  }

  if (err.status === 400) {
    return res.status(400).json({ error: err.message });
  }

  if (err.status === 401) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (err.status === 403) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFound = (req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found' });
};
