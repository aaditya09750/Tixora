import { UserSession } from '../auth/get-user.decorator.js';

declare global {
  namespace Express {
    interface Request {
      user?: UserSession;
    }
  }
}
