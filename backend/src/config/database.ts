import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Use DATABASE_URL if available (Railway provides this automatically)
// otherwise fall back to individual variables
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
      logging: false,
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    })
  : new Sequelize({
      dialect: 'postgres',
      host: (process.env.DB_HOST || 'localhost').trim(),
      port: Number(process.env.DB_PORT) || 5432,
      database: (process.env.DB_NAME || 'shopline_blind_box').trim(),
      username: (process.env.DB_USER || 'postgres').trim(),
      password: (process.env.DB_PASSWORD || '').trim(),
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    });

export default sequelize;
