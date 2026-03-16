import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Teacher from './Teacher.js';
import Student from './Student.js';

const Advisory = sequelize.define('Advisory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'teacher_id',
    references: {
      model: Teacher,
      key: 'id'
    }
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'student_id',
    references: {
      model: Student,
      key: 'id'
    }
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'start_date'
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'end_date'
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'active'
  }
}, {
  tableName: 'advisories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// 定义关联关系
Advisory.belongsTo(Teacher, { foreignKey: 'teacher_id', as: 'teacher' });
Advisory.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

export default Advisory;


