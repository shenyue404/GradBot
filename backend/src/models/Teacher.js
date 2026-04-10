import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Teacher = sequelize.define(
  'Teacher',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    teacherId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'teacher_id',
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    researchFields: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'research_fields',
      get() {
        const value = this.getDataValue('researchFields');
        return value ? JSON.parse(value) : [];
      },
      set(value) {
        this.setDataValue('researchFields', JSON.stringify(value || []));
      },
    },
    avatar: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    birthDate: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: 'birth_date',
    },
    gender: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    office: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    officeHours: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'office_hours',
    },
  },
  {
    tableName: 'teachers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Teacher;
