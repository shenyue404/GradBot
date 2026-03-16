import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Student from './Student.js';

const Topic = sequelize.define('Topic', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'student_id',
    references: {
      model: Student,
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  direction: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  keywords: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('keywords');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('keywords', JSON.stringify(value || []));
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'draft'
  },
  generatedOptions: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'generated_options',
    get() {
      const value = this.getDataValue('generatedOptions');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('generatedOptions', JSON.stringify(value || []));
    }
  },
  confirmedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'confirmed_at'
  }
}, {
  tableName: 'topics',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Topic;


