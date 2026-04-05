import axios from 'axios';
import { Transaction } from 'sequelize';
import { PoolItem, Shop } from '../models';

/**
 * Weighted random selection of a pool item.
 * Only considers items with stock > 0.
 * Probability of selection = item.weight / sum(all eligible weights)
 */
export function selectItemByWeight(items: PoolItem[]): PoolItem | null {
  const eligible = items.filter((item) => item.stock > 0);
  if (eligible.length === 0) return null;

  const totalWeight = eligible.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of eligible) {
    random -= item.weight;
    if (random <= 0) return item;
  }

  // Fallback — return last eligible item
  return eligible[eligible.length - 1];
}

/**
 * Decrement stock of the selected item within a transaction.
 * Throws if the item is out of stock (race condition guard).
 * Also syncs inventory to Shopline if the item has a linked product variant.
 */
export async function decrementStock(item: PoolItem, transaction: Transaction): Promise<void> {
  const fresh = await PoolItem.findByPk(item.id, { transaction, lock: true });
  if (!fresh || fresh.stock <= 0) {
    throw new Error(`Item "${item.name}" is out of stock.`);
  }
  await fresh.decrement('stock', { by: 1, transaction });

  // Best-effort: sync inventory to Shopline if linked to a product variant
  if (fresh.shoplineVariantId) {
    syncShoplineInventory(fresh).catch((err) =>
      console.error('[InventorySync] Failed:', err.message)
    );
  }
}

/**
 * Fire-and-forget: tell Shopline to decrement inventory for the linked variant.
 * Runs outside the DB transaction so it never blocks or rolls back the purchase.
 */
async function syncShoplineInventory(item: PoolItem): Promise<void> {
  // Find any active shop to use its token (single-store apps use the first one)
  const shop = await Shop.findOne({ where: { isActive: true } } as any);
  if (!shop) return;

  const shopDomain = (shop as any).shopDomain;
  const accessToken = (shop as any).accessToken;

  // Shopline inventory adjust: POST /admin/open/2022-01/inventory_levels/adjust.json
  await axios.post(
    `https://${shopDomain}/admin/open/2022-01/inventory_levels/adjust.json`,
    {
      inventory_item_id: item.shoplineVariantId,
      available_adjustment: -1,
    },
    { headers: { 'X-Shopline-Access-Token': accessToken } }
  );
  console.log(`[InventorySync] Decremented Shopline inventory for variant ${item.shoplineVariantId}`);
}
