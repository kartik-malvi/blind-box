import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'customer';
  };
}

export interface JWTPayload {
  id: string;
  email: string;
  role: 'admin' | 'customer';
}
