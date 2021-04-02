const Sequelize = require('sequelize');

module.exports = (db) => {
	return db.define('conversation', {
		name: {
			type: Sequelize.STRING
		},
		isPrivate: {
			type: Sequelize.BOOLEAN,
			defaultValue: false
		},
		createdBy: Sequelize.INTEGER
	});
};
