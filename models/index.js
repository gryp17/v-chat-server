const Sequelize = require('sequelize');
const config = require('../config');

const db = new Sequelize(config.db.database, config.db.user, config.db.password, {
	host: config.db.host,
	dialect: 'mysql',
	define: {
		//don't pluralize table names
		freezeTableName: true
	}
});

const User = db.define('user', {
	username: {
		type: Sequelize.STRING
	},
	password: {
		type: Sequelize.STRING
	},
	avatar: {
		type: Sequelize.STRING
	}
});

/**
 * Syncs the models and the mysql tables
 */
const sync = () => {
	return db.sync({
		//drops and recreates the tables
		force: true
	});
};

/**
 * Syncs the models and then inserts the seed data
 */
const syncAndSeed = () => {
	return sync().then(() => {
		User.create({
			username: 'Plamen',
			password: 'plain password (add some hashing later)',
			avatar: null
		});
	});
};

module.exports = {
	User,
	sync,
	syncAndSeed
};