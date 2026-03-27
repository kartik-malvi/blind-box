import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ShoplineConfigAttributes {
  id: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ShoplineConfigCreationAttributes extends Optional<ShoplineConfigAttributes, 'id' | 'scopes'> {}

class ShoplineConfig extends Model<ShoplineConfigAttributes, ShoplineConfigCreationAttributes>
  implements ShoplineConfigAttributes {
  declare id: string;
  declare clientId: string;
  declare clientSecret: string;
  declare redirectUri: string;
  declare scopes: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ShoplineConfig.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    clientId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    clientSecret: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    redirectUri: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    scopes: {
      type: DataTypes.STRING,
      defaultValue: 'read_products,write_products,read_orders,write_orders,read_inventory,write_inventory',
    },
  },
  {
    sequelize,
    tableName: 'shopline_config',
  }
);

export default ShoplineConfig;
