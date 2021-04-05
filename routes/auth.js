
const express = require('express');
const { uploads, errorCodes } = require('../config');
const { User, Conversation, Settings } = require('../models');
const app = require('../app');
const { isLoggedIn } = require('../middleware/authentication');
const { validate } = require('../middleware/validator');
const { sendResponse, sendError, sendApiError, compareHash, makeHash } = require('../utils');

const router = express.Router();

const rules = {
	login: {
		email: ['required', 'email'],
		password: 'required'
	},
	signup: {
		email: ['required', 'max-100', 'email', 'unique'],
		displayName: ['required', 'min-3', 'max-30', 'unique'],
		password: ['required', 'strong-password', 'max-100'],
		repeatPassword: ['required', 'matches(password)']
	}
};

/**
 * "Ping" endpoint that is used to check if the server is responding
 */
router.get('/handshake', (req, res) => {
	sendResponse(res, {
		success: true
	});
});

/**
 * Logs in the user with the provided credentials
 */
router.post('/login', validate(rules.login), async (req, res) => {
	const email = req.body.email;
	const password = req.body.password;

	try {
		const record = await User.findOne({
			where: {
				email
			}
		});

		if (!record) {
			return sendError(res, {
				password: errorCodes.WRONG_PASSWORD
			});
		}

		const valid = await compareHash(password, record.password);

		if (!valid) {
			return sendError(res, {
				password: errorCodes.WRONG_PASSWORD
			});
		}

		const user = record.toJSON();
		delete user.password;

		req.session.user = user;

		sendResponse(res, {
			user
		});
	} catch (err) {
		sendApiError(res, err);
	}
});

/**
 * Signs up the user with the provided data
 */
router.post('/signup', validate(rules.signup), async (req, res) => {
	const email = req.body.email;
	const displayName = req.body.displayName;
	const password = req.body.password;

	const chat = app.get('chat');

	try {
		const hashedPassword = await makeHash(password);
		const userInstance = await User.create({
			email,
			password: hashedPassword,
			displayName,
			avatar: uploads.avatars.defaultAvatar
		});

		//create the settings record
		await Settings.create({
			userId: userInstance.id
		});

		//automatically join the global conversation
		const globalConversationId = 1;
		const conversationInstance = await Conversation.findByPk(globalConversationId);
		await conversationInstance.addUser(userInstance);

		const user = userInstance.toJSON();
		delete user.password;

		req.session.user = user;

		//notify all connected users about the new user
		chat.newUser(user.id);

		sendResponse(res, {
			user
		});
	} catch (err) {
		sendApiError(res, err);
	}
});

/**
 * Returns the current user session
 */
router.get('/session', isLoggedIn, (req, res) => {
	sendResponse(res, {
		user: req.session.user
	});
});

/**
 * Logs out the user
 */
router.get('/logout', (req, res) => {
	req.session.destroy(() => {
		sendResponse(res, true);
	});
});

module.exports = router;
