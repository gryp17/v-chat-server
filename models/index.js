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
	}
});

const Conversation = db.define('conversation', {
	name: {
		type: Sequelize.STRING
	}
});

const UserConversation = db.define('user_conversation');

const Message = db.define('message', {
	content: {
		type: Sequelize.STRING
	}
});

User.belongsToMany(Conversation, {
	through: UserConversation
});

Conversation.belongsToMany(User, {
	through: UserConversation
});

Message.belongsTo(User);
Message.belongsTo(Conversation);


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
		return User.create({
			email: 'plamen@abv.bg',
			password: hashedPassword,
			displayName: 'Plamen',
			bio: null,
			avatar: null
		});
	}).then((userInstance) => {
		//create the global conversation and join it with the newly created user
		Conversation.create({
			name: 'Global'
		}).then((conversationInstance) => {
			return UserConversation.create({
				userId: userInstance.id,
				conversationId: conversationInstance.id
			}).then(() => {
				Message.create({
					content: 'hi there',
					userId: userInstance.id,
					conversationId: conversationInstance.id
				});
			});
		});
	});
};

module.exports = {
	User,
	Conversation,
	UserConversation,
	Message,
	sync,
	syncAndSeed
};
