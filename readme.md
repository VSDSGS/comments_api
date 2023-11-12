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

# Docker run

1. Setup the next list of required env variables in the .env file
- DATABASE_URL. (Docker)
2. run command
```bash
$ docker-compose up
```
- http://localhost:5432/ for access to the postgres
- http://localhost:8080/ base url of the API


## Local run

1. Setup the next list of required env variables in the .env file
- DATABASE_URL. (Local)
2. run command
```bash
$ npm run start
```
or
```bash
$ npm run start:dev
```
- http://localhost:5500/ base url of the API

## ApiDoc

1. Execute command
```bash
$ npm run doc
```
2. Open the html `doc/index.html` in browser window.
