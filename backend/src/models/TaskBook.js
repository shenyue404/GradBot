import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TaskBook = sequelize.define(
  'TaskBook',
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
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    requirements: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    schedule: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue('schedule');
        return value ? JSON.parse(value) : [];
      },
      set(value) {
        this.setDataValue('schedule', JSON.stringify(value || []));
      },
    },
    draftContent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'draft_content',
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
    aiEvaluation: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'ai_evaluation',
    },
    confirmedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'confirmed_at',
    },
  },
  {
    tableName: 'taskbooks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default TaskBook;
