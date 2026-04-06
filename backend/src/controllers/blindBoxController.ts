import { Request, Response } from 'express';
import axios from 'axios';
import { BlindBox, PoolItem, Shop, sequelize } from '../models';

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
    const box = await BlindBox.findByPk(String(req.params.id), {
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
    const box = await BlindBox.findByPk(String(req.params.id));
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
    const box = await BlindBox.findByPk(String(req.params.id));
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
    const box = await BlindBox.findByPk(String(req.params.id));
    if (!box) {
      res.status(404).json({ message: 'Blind box not found' });
      return;
    }
    const { name, description, imageUrl, rarity, weight, stock, shoplineProductId, shoplineVariantId } = req.body;
    const item = await PoolItem.create({
      blindBoxId: box.id,
      name,
      description,
      imageUrl,
      rarity,
      weight,
      stock,
      totalStock: stock,
      shoplineProductId: shoplineProductId || null,
      shoplineVariantId: shoplineVariantId || null,
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}

export async function updatePoolItem(req: Request, res: Response): Promise<void> {
  try {
    const item = await PoolItem.findByPk(String(req.params.itemId));
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
    const item = await PoolItem.findByPk(String(req.params.itemId));
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

/**
 * Auto-create a blind box by randomly selecting products from the Shopline store.
 * POST /api/blind-boxes/auto-create
 * Body: { title, description?, price, numberOfItems, shopDomain }
 */
export async function autoCreateBlindBox(req: Request, res: Response): Promise<void> {
  const transaction = await sequelize.transaction();
  try {
    const { title, description, price, numberOfItems, shopDomain } = req.body as {
      title?: string; description?: string; price?: number;
      numberOfItems?: number; shopDomain?: string;
    };

    if (!title || !price || !numberOfItems || !shopDomain) {
      await transaction.rollback();
      res.status(400).json({ message: 'title, price, numberOfItems and shopDomain are required' });
      return;
    }

    if (numberOfItems < 1 || numberOfItems > 50) {
      await transaction.rollback();
      res.status(400).json({ message: 'numberOfItems must be between 1 and 50' });
      return;
    }

    // Get access token for this store
    const shop = await Shop.findOne({ where: { shopDomain, isActive: true } } as any);
    if (!shop) {
      await transaction.rollback();
      res.status(404).json({ message: `Shop ${shopDomain} not installed. Complete OAuth first.` });
      return;
    }

    // Fetch products from Shopline
    let allProducts: any[] = [];
    try {
      const { data } = await axios.get(
        `https://${shopDomain}/admin/open/2022-01/products.json`,
        { headers: { 'X-Shopline-Access-Token': (shop as any).accessToken }, params: { limit: '250' } }
      );
      allProducts = data?.products || data?.data?.products || [];
    } catch (err: any) {
      await transaction.rollback();
      res.status(502).json({ message: 'Failed to fetch products from Shopline', error: err.response?.data || err.message });
      return;
    }

    // Filter products that have inventory
    const inStock = allProducts.filter(p =>
      (p.variants || []).some((v: any) => (v.inventory_quantity ?? v.inventoryQuantity ?? 0) > 0)
    );

    if (inStock.length === 0) {
      await transaction.rollback();
      res.status(400).json({ message: 'No products with stock found in your Shopline store' });
      return;
    }

    // Randomly pick up to numberOfItems products (no duplicates)
    const shuffled = [...inStock].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(numberOfItems, shuffled.length));

    // Assign rarity based on position (first ones get rarer)
    const rarityLevels = ['legendary', 'rare', 'uncommon', 'common'] as const;
    const getWeight = (idx: number, total: number) => {
      const pct = idx / total;
      if (pct < 0.1) return { rarity: 'legendary' as const, weight: 5 };
      if (pct < 0.25) return { rarity: 'rare' as const, weight: 15 };
      if (pct < 0.5) return { rarity: 'uncommon' as const, weight: 30 };
      return { rarity: 'common' as const, weight: 60 };
    };

    // Create blind box
    const box = await BlindBox.create({ name: title, description: description || '', price }, { transaction });

    // Create pool items
    const poolItems = await Promise.all(
      selected.map(async (product, idx) => {
        const variant = (product.variants || []).find((v: any) =>
          (v.inventory_quantity ?? v.inventoryQuantity ?? 0) > 0
        ) || product.variants?.[0];
        const stock = variant?.inventory_quantity ?? variant?.inventoryQuantity ?? 1;
        const image = product.image?.src || product.images?.[0]?.src || null;
        const { rarity, weight } = getWeight(idx, selected.length);

        return PoolItem.create({
          blindBoxId: box.id,
          name: product.title,
          imageUrl: image,
          rarity,
          weight,
          stock,
          totalStock: stock,
          shoplineProductId: String(product.id),
          shoplineVariantId: variant ? String(variant.id) : null,
        } as any, { transaction });
      })
    );

    await transaction.commit();

    res.status(201).json({
      message: `Blind box "${title}" created with ${poolItems.length} items`,
      box: { id: box.id, name: box.name, price: box.price },
      items: poolItems.map(item => ({
        name: (item as any).name,
        rarity: (item as any).rarity,
        stock: (item as any).stock,
        weight: (item as any).weight,
      })),
    });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ message: 'Auto-create failed', error: (err as Error).message });
  }
}
