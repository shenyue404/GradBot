import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Review = sequelize.define(
  'Review',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    topicId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'topic_id',
    },
    reviewerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reviewer_id',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    aiAssistant: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'ai_assistant',
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'draft',
    },
  },
  {
    tableName: 'reviews',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Review;
