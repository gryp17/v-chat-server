const express = require('express');
const bodyParser = require('body-parser');

const app = module.exports = express();

//get the environment
const environment = process.env.NODE_ENV || 'development';

//get config from the environment
const config = require(`./config/${environment}`);

//store the config
app.set('config', config);

app.listen(config.port, () => {
	console.log(`listening on port ${config.port}`);
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('./public'));

//routes
app.use('/auth', require('./routes/auth'));

//catch 404 and forward to error handler
app.use((req, res, next) => {
	const err = new Error('Not Found');
	err.status = 404;
	next(err);
});

//error handler
app.use((err, req, res, next) => {
	res.send({
		apiError: err.message
	});
});
