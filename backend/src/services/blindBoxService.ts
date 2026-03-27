import { Transaction } from 'sequelize';
import { PoolItem } from '../models';

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
 */
export async function decrementStock(item: PoolItem, transaction: Transaction): Promise<void> {
  const fresh = await PoolItem.findByPk(item.id, { transaction, lock: true });
  if (!fresh || fresh.stock <= 0) {
    throw new Error(`Item "${item.name}" is out of stock.`);
  }
  await fresh.decrement('stock', { by: 1, transaction });
}
