
const express = require('express');
const jwt = require('jsonwebtoken');
const app = require('../app');
const verifyToken = require('../middleware/authentication').verifyToken;

const config = app.get('config');
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

	res.send({
		success: true,
		token
	});
});

router.get('/test', verifyToken, (req, res, next) => {
	res.send({
		success: true
	});
});

module.exports = router;
