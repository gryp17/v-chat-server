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
	},
	avatarPath: {
		type: Sequelize.VIRTUAL,
		get() {
			return `${config.cdn}/avatars/${this.avatar}`;
		}
	}
});

const Conversation = db.define('conversation', {
	name: {
		type: Sequelize.STRING
	},
	isPrivate: {
		type: Sequelize.BOOLEAN,
		defaultValue: false
	},
	createdBy: Sequelize.INTEGER
});

const UserConversation = db.define('user_conversation', {
	unread: {
		type: Sequelize.BOOLEAN,
		defaultValue: false
	}
});

const Message = db.define('message', {
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

const File = db.define('file', {
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

File.belongsTo(Message);
Message.hasOne(File);

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

		//send a message from each user
		await Promise.all(userInstances.map((userInstance) => {
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
	sync,
	syncAndSeed
};
