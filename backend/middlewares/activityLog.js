import { ActivityLog } from '../models/index.js';

export function logActivity(module, actionResolver) {
  return async (req, _res, next) => {
    const userId = req.user?.id;
    req.logActivity = async (payload = {}) => {
      await ActivityLog.create({
        user_id: userId,
        module,
        action: typeof actionResolver === 'function' ? actionResolver(req) : actionResolver,
        payload
      });
    };
    next();
  };
}
