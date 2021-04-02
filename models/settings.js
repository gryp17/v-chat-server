const Sequelize = require('sequelize');

module.exports = (db) => {
	return db.define('settings', {
		showMessageNotifications: {
			type: Sequelize.BOOLEAN,
			defaultValue: true
		},
		showOnlineStatusNotifications: {
			type: Sequelize.BOOLEAN,
			defaultValue: true
		}
	});
};
