import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ValidationError } from 'sequelize';
import { User } from '../models';
import { AuthRequest } from '../types';

function signToken(userId: string, email: string, role: string): string {
  return jwt.sign(
    { id: userId, email, role },
    process.env.JWT_SECRET as string,
    { expiresIn: 604800 } // 7 days in seconds
  );
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      res.status(400).json({ message: 'Email already in use' });
      return;
    }

    const user = await User.create({ name, email, password });
    const token = signToken(user.id, user.email, user.role);

    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    if (err instanceof ValidationError) {
      const firstErr = err.errors[0];
      let msg = firstErr?.message || 'Validation error';
      if (firstErr?.validatorKey === 'isEmail') msg = 'Please enter a valid email address';
      res.status(400).json({ message: msg });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = signToken(user.id, user.email, user.role);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await User.findByPk(req.user!.id, {
      attributes: { exclude: ['password'] },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}
