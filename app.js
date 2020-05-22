const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const config = require('./config');
const models = require('./models'); //eslint-disable-line
const { sendApiError } = require('./utils');
const app = module.exports = express();

//sync the db models (only when necessary)
//models.syncAndSeed();

const server = app.listen(config.port, () => {
	console.log(`listening on port ${config.port}`);
});

//initialize the sockets
require('./sockets')(server);

app.use(cors({
	credentials: true,
	origin: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('./public'));

//routes
app.use('/auth', require('./routes/auth'));
app.use('/conversations', require('./routes/conversations'));

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
