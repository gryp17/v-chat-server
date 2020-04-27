const Sequelize = require('sequelize');
const config = require('../config');
const { makeHash } = require('../utils');

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
	displayName: {
		type: Sequelize.STRING
	},
	bio: {
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
		return makeHash('1234');
	}).then((hashedPassword) => {
		User.create({
			username: 'plamen',
			password: hashedPassword,
			displayName: 'Plamen',
			bio: null,
			avatar: null
		});
	});
};

module.exports = {
	User,
	sync,
	syncAndSeed
};
