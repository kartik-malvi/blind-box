import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type OrderStatus = 'pending' | 'paid' | 'revealed' | 'shipped' | 'delivered' | 'cancelled';

interface OrderAttributes {
  id: string;
  userId: string;
  blindBoxId: string;
  poolItemId?: string;      // Assigned after reveal (on purchase)
  quantity: number;
  totalPrice: number;
  status: OrderStatus;
  revealedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'poolItemId' | 'revealedAt' | 'status'> {}

class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  declare id: string;
  declare userId: string;
  declare blindBoxId: string;
  declare poolItemId: string;
  declare quantity: number;
  declare totalPrice: number;
  declare status: OrderStatus;
  declare revealedAt: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    blindBoxId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'blind_boxes', key: 'id' },
    },
    poolItemId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'pool_items', key: 'id' },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: { min: 1 },
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'revealed', 'shipped', 'delivered', 'cancelled'),
      defaultValue: 'pending',
    },
    revealedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'orders',
  }
);

export default Order;
