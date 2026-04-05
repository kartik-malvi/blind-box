import { Request, Response } from 'express';
import crypto from 'crypto';
import { AuthRequest } from '../types';
import { BlindBox, PoolItem, Order, User, sequelize } from '../models';
import { selectItemByWeight, decrementStock } from '../services/blindBoxService';

export async function purchaseBlindBox(req: AuthRequest, res: Response): Promise<void> {
  const transaction = await sequelize.transaction();
  try {
    const { blindBoxId, quantity = 1 } = req.body;
    const userId = req.user!.id;

    const box = await BlindBox.findByPk(blindBoxId, {
      include: [{ model: PoolItem, as: 'items' }],
      transaction,
    });

    if (!box || !box.isActive) {
      await transaction.rollback();
      res.status(404).json({ message: 'Blind box not found or inactive' });
      return;
    }

    const items = (box as any).items as PoolItem[];
    const selectedItem = selectItemByWeight(items);

    if (!selectedItem) {
      await transaction.rollback();
      res.status(400).json({ message: 'All items in this blind box are out of stock' });
      return;
    }

    await decrementStock(selectedItem, transaction);

    const order = await Order.create(
      {
        userId,
        blindBoxId,
        poolItemId: selectedItem.id,
        quantity,
        totalPrice: Number(box.price) * quantity,
        status: 'paid',
        revealedAt: new Date(),
      },
      { transaction }
    );

    await transaction.commit();

    const fullOrder = await Order.findByPk(order.id, {
      include: [
        { model: BlindBox, as: 'blindBox', attributes: ['id', 'name', 'price'] },
        { model: PoolItem, as: 'revealedItem', attributes: ['id', 'name', 'rarity', 'imageUrl', 'description'] },
      ],
    });

    res.status(201).json(fullOrder);
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ message: 'Purchase failed', error: (err as Error).message });
  }
}

export async function getMyOrders(req: AuthRequest, res: Response): Promise<void> {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user!.id },
      include: [
        { model: BlindBox, as: 'blindBox', attributes: ['id', 'name', 'price', 'imageUrl'] },
        { model: PoolItem, as: 'revealedItem', attributes: ['id', 'name', 'rarity', 'imageUrl', 'description'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}

export async function getAllOrders(req: AuthRequest, res: Response): Promise<void> {
  try {
    const orders = await Order.findAll({
      include: [
        { model: BlindBox, as: 'blindBox', attributes: ['id', 'name'] },
        { model: PoolItem, as: 'revealedItem', attributes: ['id', 'name', 'rarity'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}

/**
 * Guest purchase — no account required.
 * Creates a temporary user (or finds existing by email) and processes the purchase.
 * Used by the storefront widget for customers without an account.
 */
export async function guestPurchase(req: Request, res: Response): Promise<void> {
  const transaction = await sequelize.transaction();
  try {
    const { blindBoxId, guestEmail, guestName } = req.body as {
      blindBoxId?: string;
      guestEmail?: string;
      guestName?: string;
    };

    if (!blindBoxId || !guestEmail) {
      await transaction.rollback();
      res.status(400).json({ message: 'blindBoxId and guestEmail are required' });
      return;
    }

    // Find or create a guest user record (no password — random placeholder)
    let user = await User.findOne({ where: { email: guestEmail }, transaction } as any);
    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString('hex');
      user = await User.create(
        { name: guestName || guestEmail.split('@')[0], email: guestEmail, password: randomPassword, role: 'customer' },
        { transaction }
      );
    }

    const box = await BlindBox.findByPk(blindBoxId, {
      include: [{ model: PoolItem, as: 'items' }],
      transaction,
    });

    if (!box || !(box as any).isActive) {
      await transaction.rollback();
      res.status(404).json({ message: 'Blind box not found or inactive' });
      return;
    }

    const items = (box as any).items as PoolItem[];
    const selectedItem = selectItemByWeight(items);

    if (!selectedItem) {
      await transaction.rollback();
      res.status(400).json({ message: 'All items in this blind box are out of stock' });
      return;
    }

    await decrementStock(selectedItem, transaction);

    const order = await Order.create(
      {
        userId: user.id,
        blindBoxId,
        poolItemId: selectedItem.id,
        quantity: 1,
        totalPrice: Number((box as any).price),
        status: 'paid',
        revealedAt: new Date(),
      },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({
      orderId: order.id,
      revealedItem: {
        name: selectedItem.name,
        rarity: selectedItem.rarity,
        imageUrl: selectedItem.imageUrl,
        description: selectedItem.description,
      },
      box: { name: (box as any).name, price: (box as any).price },
    });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ message: 'Purchase failed', error: (err as Error).message });
  }
}
