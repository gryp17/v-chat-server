
const express = require('express');
const router = express.Router();

router.post('/login', (req, res, next) => {
	res.send({
		user: {
			id: 1,
			username: 'Plamen'
		}
	});
});

router.get('/logout', (req, res, next) => {
	res.send({
		success: true
	});
});

module.exports = router;
