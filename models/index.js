const Sequelize = require('sequelize');
const config = require('../config');
const { makeHash } = require('../utils');

const db = new Sequelize(config.db.database, config.db.user, config.db.password, {
	host: config.db.host,
	dialect: 'mysql',
	define: {
		//don't pluralize table names
		freezeTableName: true,
		//needed for the emojis
		collate: 'utf8mb4_bin'
	}
});

const User = require('./user')(db);
const Conversation = require('./conversation')(db);
const UserConversation = require('./user-conversation')(db);
const Message = require('./message')(db);
const File = require('./file')(db);
const Settings = require('./settings')(db);

//setup relations
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

File.belongsTo(Message);
Message.hasOne(File);

Settings.belongsTo(User);
User.hasOne(Settings);

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
const syncAndSeed = async () => {
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

	try {
		await sync();

		const conversationInstance = await Conversation.create({
			name: 'Global'
		});

		//add all the seed users and join the global conversation
		const hashedPassword = await makeHash('1234');
		const userInstances = await Promise.all(users.map((user) => {
			return conversationInstance.createUser({
				...user,
				avatar: config.uploads.avatars.defaultAvatar,
				password: hashedPassword
			});
		}));

		await Promise.all(userInstances.map(async (userInstance) => {
			//add the settings record for each user
			await Settings.create({
				userId: userInstance.id
			});

			//send a message from each user
			return Message.create({
				type: 'text',
				content: `I am ${userInstance.displayName}`,
				userId: userInstance.id,
				conversationId: conversationInstance.id
			});
		}));
	} catch (err) {
		console.error('Failed to sync the database', err);
	}
};

module.exports = {
	User,
	Conversation,
	UserConversation,
	Message,
	File,
	Settings,
	sync,
	syncAndSeed
};
