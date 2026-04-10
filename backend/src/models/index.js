import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Teacher from './Teacher.js';
import Student from './Student.js';
import Advisory from './Advisory.js';
import Topic from './Topic.js';
import Review from './Review.js';
import TaskBook from './TaskBook.js';
import MidtermReport from './MidtermReport.js';
import Proposal from './Proposal.js';
import User from './User.js';

Teacher.belongsToMany(Student, {
  through: Advisory,
  foreignKey: 'teacher_id',
  otherKey: 'student_id',
  as: 'managedStudents',
});
Student.belongsToMany(Teacher, {
  through: Advisory,
  foreignKey: 'student_id',
  otherKey: 'teacher_id',
  as: 'advisors',
});

Student.hasMany(Topic, { foreignKey: 'student_id', as: 'topics' });
Topic.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Topic.hasMany(Review, { foreignKey: 'topic_id', as: 'reviews' });
Review.belongsTo(Topic, { foreignKey: 'topic_id', as: 'topic' });
Teacher.hasMany(Review, { foreignKey: 'reviewer_id', as: 'reviews' });
Review.belongsTo(Teacher, { foreignKey: 'reviewer_id', as: 'reviewer' });

Topic.hasOne(TaskBook, { foreignKey: 'topic_id', as: 'taskBook' });
TaskBook.belongsTo(Topic, { foreignKey: 'topic_id', as: 'topic' });

Topic.hasOne(Proposal, { foreignKey: 'topic_id', as: 'proposal' });
Proposal.belongsTo(Topic, { foreignKey: 'topic_id', as: 'topic' });

Topic.hasOne(MidtermReport, { foreignKey: 'topic_id', as: 'midterm' });
MidtermReport.belongsTo(Topic, { foreignKey: 'topic_id', as: 'topic' });

export async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('MySQL database connection established.');
    return true;
  } catch (error) {
    console.error('MySQL database connection failed:', error);
    return false;
  }
}

async function ensureColumn(tableName, columnName, definition) {
  const queryInterface = sequelize.getQueryInterface();
  const columns = await queryInterface.describeTable(tableName);

  if (!columns[columnName]) {
    await queryInterface.addColumn(tableName, columnName, definition);
  }
}

async function ensureSchemaColumns() {
  await ensureColumn('users', 'student_id', {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
  });
  await ensureColumn('users', 'teacher_id', {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
  });
  await ensureColumn('users', 'is_active', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
  await ensureColumn('users', 'last_login_at', {
    type: DataTypes.DATE,
    allowNull: true,
  });
  await ensureColumn('taskbooks', 'feedback', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
  await ensureColumn('taskbooks', 'ai_evaluation', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
  await ensureColumn('students', 'department', {
    type: DataTypes.STRING(100),
    allowNull: true,
  });
}

export async function syncDatabase(force = false) {
  try {
    const syncOptions = force ? { force: true } : {};
    await User.sync(syncOptions);
    await Teacher.sync(syncOptions);
    await Student.sync(syncOptions);
    await Advisory.sync(syncOptions);
    await Topic.sync(syncOptions);
    await TaskBook.sync(syncOptions);
    await Proposal.sync(syncOptions);
    await MidtermReport.sync(syncOptions);
    await Review.sync(syncOptions);
    await ensureSchemaColumns();
    console.log('Database schema synced.');
    return true;
  } catch (error) {
    console.error('Database sync failed:', error);
    return false;
  }
}

export {
  sequelize,
  Teacher,
  Student,
  Advisory,
  Topic,
  Review,
  TaskBook,
  MidtermReport,
  Proposal,
  User,
};
