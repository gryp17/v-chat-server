const Sequelize = require('sequelize');
const config = require('../config');

module.exports = (db) => {
	return db.define('user', {
		email: {
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
		},
		avatarLink: {
			type: Sequelize.VIRTUAL,
			get() {
				return `${config.cdn}/avatars/${this.avatar}`;
			}
		}
	});
};
