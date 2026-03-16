import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Proposal = sequelize.define(
  'Proposal',
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
    researchBackground: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'research_background',
    },
    researchObjectives: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'research_objectives',
    },
    methodology: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    expectedResults: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'expected_results',
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
    tableName: 'proposals',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Proposal;
