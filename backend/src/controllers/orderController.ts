import { Response } from 'express';
import { AuthRequest } from '../types';
import { BlindBox, PoolItem, Order, sequelize } from '../models';
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
