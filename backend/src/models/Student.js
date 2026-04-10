import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Student = sequelize.define(
  'Student',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    studentId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'student_id',
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    major: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    class: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'class',
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    grade: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    advisor: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    researchDirection: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'research_direction',
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
  },
  {
    tableName: 'students',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Student;
