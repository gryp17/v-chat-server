
const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { verifyToken } = require('../middleware/authentication');
const { sendResponse } = require('../utils');

const router = express.Router();

router.get('/login', (req, res, next) => {
	const dummyUser = {
		user: {
			id: 1,
			username: 'Plamen'
		}
	};

	const token = jwt.sign(dummyUser, config.auth.secret, {
		expiresIn: 86400 // expires in 24 hours
	});

	sendResponse(res, {
		success: true,
		token
	});
});

router.get('/test', verifyToken, (req, res, next) => {
	sendResponse(res, {
		success: true
	});
});

module.exports = router;
