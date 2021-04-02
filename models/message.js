const Sequelize = require('sequelize');

module.exports = (db) => {
	return db.define('message', {
		type: {
			type: Sequelize.STRING, //text | file
			defaultValue: 'text'
		},
		content: {
			type: Sequelize.STRING(1400)
		}
	}, {
		charset: 'utf8mb4', //needed for the emojis
		collate: 'utf8mb4_bin'
	});
};
