const fs = require('fs');
const test = require('./middleware/test');

console.log('it works');

setTimeout(() => {
	console.log('aaaaaaaaaaaa');
}, 5000);

fs.stat('README.md', (err, data) => {
	console.log(data);
});

const result = test();

console.log(result);
