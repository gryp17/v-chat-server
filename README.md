# v-chat-server
A self hosted NodeJS chat server that is compatible with the [v-chat-client](https://github.com/gryp17/v-chat-client) desktop application.
It uses a MySQL database and Socket.io for the realtime communication with the clients.

## Configuration
The development configuration file is located in

> [/config/development.js](https://github.com/gryp17/v-chat-server/blob/master/config/development.js)

It contains the database configuration and other application parameters.

## Project setup
Configure the database parameters, CDN url, application port... and then run the following commands:

Install the dependencies
```
npm install
```

Create the database tables in production mode
```
npm run sync-models
```

Create the database tables and inserts seed data in development mode
```
npm run sync-models-dev
```

### Runs the project in development mode
```
npm run start-dev
```

### Runs the project in production mode
```
npm run start
```

### Lints and fixes files
```
npm run lint
```

