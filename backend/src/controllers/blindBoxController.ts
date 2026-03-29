import { Request, Response } from 'express';
import { BlindBox, PoolItem } from '../models';

export async function getAllBlindBoxes(req: Request, res: Response): Promise<void> {
  try {
    const boxes = await BlindBox.findAll({
      where: { isActive: true },
      include: [{ model: PoolItem, as: 'items', attributes: ['id', 'name', 'rarity', 'imageUrl'] }],
    });
    res.json(boxes);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}

export async function getBlindBoxById(req: Request, res: Response): Promise<void> {
  try {
    const box = await BlindBox.findByPk(req.params.id as string, {
      include: [{ model: PoolItem, as: 'items', attributes: ['id', 'name', 'rarity', 'weight', 'stock', 'imageUrl', 'description'] }],
    });
    if (!box) {
      res.status(404).json({ message: 'Blind box not found' });
      return;
    }
    res.json(box);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}

export async function createBlindBox(req: Request, res: Response): Promise<void> {
  try {
    const { name, description, price, imageUrl } = req.body;
    const box = await BlindBox.create({ name, description, price, imageUrl });
    res.status(201).json(box);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}

export async function updateBlindBox(req: Request, res: Response): Promise<void> {
  try {
    const box = await BlindBox.findByPk(req.params.id as string);
    if (!box) {
      res.status(404).json({ message: 'Blind box not found' });
      return;
    }
    await box.update(req.body);
    res.json(box);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}

export async function deleteBlindBox(req: Request, res: Response): Promise<void> {
  try {
    const box = await BlindBox.findByPk(req.params.id as string);
    if (!box) {
      res.status(404).json({ message: 'Blind box not found' });
      return;
    }
    await box.update({ isActive: false });
    res.json({ message: 'Blind box deactivated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}

// Pool Items
export async function addPoolItem(req: Request, res: Response): Promise<void> {
  try {
    const box = await BlindBox.findByPk(req.params.id as string);
    if (!box) {
      res.status(404).json({ message: 'Blind box not found' });
      return;
    }
    const { name, description, imageUrl, rarity, weight, stock } = req.body;
    const item = await PoolItem.create({
      blindBoxId: box.id,
      name,
      description,
      imageUrl,
      rarity,
      weight,
      stock,
      totalStock: stock,
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}

export async function updatePoolItem(req: Request, res: Response): Promise<void> {
  try {
    const item = await PoolItem.findByPk(req.params.itemId as string);
    if (!item) {
      res.status(404).json({ message: 'Pool item not found' });
      return;
    }
    await item.update(req.body);
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}

export async function deletePoolItem(req: Request, res: Response): Promise<void> {
  try {
    const item = await PoolItem.findByPk(req.params.itemId as string);
    if (!item) {
      res.status(404).json({ message: 'Pool item not found' });
      return;
    }
    await item.destroy();
    res.json({ message: 'Pool item removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}
