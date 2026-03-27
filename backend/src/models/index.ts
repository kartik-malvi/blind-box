import sequelize from '../config/database';
import User from './User';
import BlindBox from './BlindBox';
import PoolItem from './PoolItem';
import Order from './Order';
import ShoplineConfig from './ShoplineConfig';
import Shop from './Shop';

// Associations
BlindBox.hasMany(PoolItem, { foreignKey: 'blindBoxId', as: 'items' });
PoolItem.belongsTo(BlindBox, { foreignKey: 'blindBoxId', as: 'blindBox' });

User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

BlindBox.hasMany(Order, { foreignKey: 'blindBoxId', as: 'orders' });
Order.belongsTo(BlindBox, { foreignKey: 'blindBoxId', as: 'blindBox' });

PoolItem.hasMany(Order, { foreignKey: 'poolItemId', as: 'orders' });
Order.belongsTo(PoolItem, { foreignKey: 'poolItemId', as: 'revealedItem' });

export { sequelize, User, BlindBox, PoolItem, Order, ShoplineConfig, Shop };
