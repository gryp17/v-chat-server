const Sequelize = require('sequelize');
const config = require('../config');

module.exports = (db) => {
	return db.define('file', {
		type: {
			type: Sequelize.STRING
		},
		name: {
			type: Sequelize.STRING
		},
		originalName: {
			type: Sequelize.STRING
		},
		size: {
			type: Sequelize.INTEGER
		},
		link: {
			type: Sequelize.VIRTUAL,
			get() {
				return `${config.cdn}/attachments/${this.name}`;
			}
		}
	});
};
