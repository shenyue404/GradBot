import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('student', 'teacher', 'admin'),
      allowNull: false,
    },
    studentId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      field: 'student_id',
    },
    teacherId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      field: 'teacher_id',
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    major: {
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
    title: {
      type: DataTypes.STRING(50),
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
    office: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    officeHours: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'office_hours',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login_at',
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default User;
