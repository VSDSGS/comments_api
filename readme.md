# API for Comments

Server code for the Comments app

## Installation

```bash
$ npm install
```

# Environment

The app environment can have one of the values:
- `development`;
<!-- - `production`. -->

You can find a list of required and optional environment variables in the .env.

# Local run

1. Setup the next list of required env variables in the config/defaults or .env file
- JWT_SECRET.
2. run command
```bash
$ docker-compose up
```
- http://localhost:5432/ for access to the postgres
- http://localhost:8080/ base url of the API


## Run

```bash
$ npm run start
```
or
```bash
$ npm run start:dev
```

## ApiDoc

1. Execute command
```bash
$ npm run doc
```
2. Open the html `doc/index.html` in browser window.
