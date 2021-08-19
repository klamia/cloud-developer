'use strict';
export function up(queryInterface, Sequelize) {
  return queryInterface.createTable('User', {
    id: {
      allowNull: false,
      autoIncrement: true,
      type: Sequelize.INTEGER
    },
    email: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    password_hash: {
      type: Sequelize.STRING
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE
    }
  });
}
export function down(queryInterface, Sequelize) {
  return queryInterface.dropTable('User');
}