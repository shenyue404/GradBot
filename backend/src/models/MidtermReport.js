import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MidtermReport = sequelize.define(
  'MidtermReport',
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
    progress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    problems: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    solutions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    achievements: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    keyComments: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'key_comments',
    },
    aiAnalysis: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'ai_analysis',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'draft',
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'submitted_at',
    },
  },
  {
    tableName: 'midterm_reports',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default MidtermReport;
