import { SystemLog } from '../models/index.js';

export const logRequest = async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const action = `${req.method} ${req.path}`;
    const ip = req.ip || req.connection.remoteAddress;
    // Fire and forget – don't block the request
    SystemLog.create({ user_id: userId, action, ip_address: ip, timestamp: new Date() }).catch(() => {});
  } catch (_) {}
  next();
};
