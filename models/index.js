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
	},
	isPrivate: {
		type: Sequelize.BOOLEAN,
		defaultValue: false
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

Conversation.hasMany(Message);
Message.belongsTo(Conversation);

User.hasMany(Message);
Message.belongsTo(User);


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
	const users = [
		{
			email: 'plamen@abv.bg',
			displayName: 'Plamen'
		},
		{
			email: 'fran@gmail.com',
			displayName: 'Fran'
		},
		{
			email: 'jacobo@gmail.com',
			displayName: 'Jacobo'
		}
	];

	return sync().then(() => {
		//add the global conversation
		return Conversation.create({
			name: 'Global'
		});
	}).then((conversationInstance) => {
		//add all the seed users and join the global conversation
		makeHash('1234').then((hashedPassword) => {
			return Promise.all(users.map((user) => {
				return conversationInstance.createUser({
					...user,
					password: hashedPassword
				});
			}));
		}).then((userInstances) => {
			//send a message from each user
			userInstances.forEach((userInstance) => {
				Message.create({
					content: `I am ${userInstance.displayName}`,
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
