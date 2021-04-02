const Sequelize = require('sequelize');

module.exports = (db) => {
	return db.define('user_conversation', {
		unread: {
			type: Sequelize.BOOLEAN,
			defaultValue: false
		},
		muted: {
			type: Sequelize.BOOLEAN,
			defaultValue: false
		}
	});
};
