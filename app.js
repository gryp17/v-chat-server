const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const config = require('./config');
const { sendApiError } = require('./utils');
const app = module.exports = express();

const server = app.listen(config.port, () => {
	console.log(`listening on port ${config.port}`);
});

//initialize the sockets
const chat = require('./sockets')(server);
app.set('chat', chat);

app.use(cors({
	credentials: true,
	origin: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('./public'));

//routes
app.use('/auth', require('./routes/auth'));
app.use('/conversation', require('./routes/conversation'));
app.use('/user', require('./routes/user'));
app.use('/message', require('./routes/message'));
app.use('/settings', require('./routes/settings'));

//catch 404 and forward to error handler
app.use((req, res, next) => {
	const err = new Error('Not Found');
	err.status = 404;
	next(err);
});

//error handler
app.use((err, req, res, next) => {
	sendApiError(res, err.message);
});
