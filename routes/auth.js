
const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');
const { verifyToken } = require('../middleware/authentication');
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

router.get('/handshake', (req, res, next) => {
	sendResponse(res, {
		success: true
	});
});

router.post('/login', validate(rules.login), (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;

	User.findOne({
		where: {
			email
		}
	}).then((record) => {
		if (!record) {
			return sendError(res, {
				password: 'Wrong email or password'
			});
		}

		compareHash(password, record.password).then((valid) => {
			if (!valid) {
				return sendError(res, {
					password: 'Wrong email or password'
				});
			}

			const user = record.toJSON();
			delete user.password;

			const token = jwt.sign(user, config.auth.secret, {
				expiresIn: 86400 // expires in 24 hours
			});

			sendResponse(res, {
				user,
				token
			});
		});
	}).catch((err) => {
		sendApiError(res, err);
	});
});

router.post('/signup', validate(rules.signup), (req, res, next) => {
	const email = req.body.email;
	const displayName = req.body.displayName;
	const password = req.body.password;

	makeHash(password).then((hashedPassword) => {
		return User.create({
			email,
			password: hashedPassword,
			displayName,
			avatar: config.uploads.avatars.defaultAvatar
		});
	}).then((record) => {
		const user = record.toJSON();
		delete user.password;

		const token = jwt.sign(user, config.auth.secret, {
			expiresIn: 86400 // expires in 24 hours
		});

		sendResponse(res, {
			user,
			token
		});
	}).catch((err) => {
		sendApiError(res, err);
	});
});

router.get('/session', verifyToken, (req, res, next) => {
	sendResponse(res, {
		user: req.user
	});
});

module.exports = router;
