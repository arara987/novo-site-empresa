import { registerActivity } from '../services/adminService.js';

export function logActivity(module, actionResolver) {
  return async (req, _res, next) => {
    const userId = req.user?.id;
    req.logActivity = async (payload = {}) => {
      registerActivity({
        userId,
        module,
        action: typeof actionResolver === 'function' ? actionResolver(req) : actionResolver,
        payload
      });
    };
    next();
  };
}
