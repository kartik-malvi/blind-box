import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

interface PoolItemAttributes {
  id: string;
  blindBoxId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  rarity: Rarity;
  weight: number;       // Probability weight (e.g. common=70, rare=20, legendary=10)
  stock: number;        // Remaining inventory
  totalStock: number;   // Original inventory
  createdAt?: Date;
  updatedAt?: Date;
}

interface PoolItemCreationAttributes extends Optional<PoolItemAttributes, 'id' | 'description' | 'imageUrl'> {}

class PoolItem extends Model<PoolItemAttributes, PoolItemCreationAttributes> implements PoolItemAttributes {
  declare id: string;
  declare blindBoxId: string;
  declare name: string;
  declare description: string;
  declare imageUrl: string;
  declare rarity: Rarity;
  declare weight: number;
  declare stock: number;
  declare totalStock: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

PoolItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    blindBoxId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'blind_boxes', key: 'id' },
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rarity: {
      type: DataTypes.ENUM('common', 'uncommon', 'rare', 'legendary'),
      allowNull: false,
    },
    weight: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: { min: 1 },
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    totalStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'pool_items',
  }
);

export default PoolItem;
