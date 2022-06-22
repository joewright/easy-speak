/* global require, process, console, __dirname, exports */
'use strict';
const {Client} = require('pg');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const pgConnectRetries = 4;
const pgRetryIntervalMs = 5000;

exports.run = run;
run();

function run() {
	startServer(pgClient);
	// getPGClient(0, (err, pgClient) => {});
}

function startServer(pgClient) {
	// app.set('pgClient', pgClient);

	app.use(express.static(path.join(__dirname, 'public')));
	app.use(logger());
	app.get('/phrases/:id', function(req, res) {
		return res.status(404).send({error: 'not found'});
		// var queryText = 'SELECT * FROM clips WHERE id = $1';
		// app.get('pgClient').query(queryText, [req.params.id], function(err, result) {
		// 	if (err || !result || !result.rows[0]) {
		// 	}
		// 	return res.send(result.rows[0]);
		// });
	});

	app.post('/save', bodyParser.json(), function(req, res) {
		return res.status(422).send({errors: 'Failed to save, lol'});
		// var insertTxt = 'INSERT INTO clips(content, voice) VALUES($1, $2) RETURNING *';
		// var values = [req.body.content, req.body.voice || ''];
		// app.get('pgClient').query(insertTxt, values, function(err, result) {
		// 	if (err) {
		// 	}
		// 	res.send(result.rows[0]);
		// });
	});

	app.listen(process.env.PORT, function() {
		console.log('Dang web server ready for it at port', process.env.PORT);
	});

	process.on('SIGTERM', function() {
		console.log('exiting');
		process.exit();
	});
}

function getPGClient(attempts, ready) {
	const client = new Client(process.env.DATABASE_URL);
	client.connect((err) => {
		if (err) {
			if (attempts < pgConnectRetries) {
				attempts++;
				console.error(`Failed to connect to PG after ${attempts} attempt(s). Retrying...`);
				return setTimeout(() => {
					getPGClient(attempts, ready);
				}, pgRetryIntervalMs);
			}
			throw err;
		}
		console.log('postgresql: connected');
		setupDB(client);
		ready(err, client);
	});
}

function setupDB(client) {
	const createTableText = `
	CREATE EXTENSION IF NOT EXISTS "pgcrypto";

	CREATE TEMP TABLE IF NOT EXISTS clips (
	  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	  content varchar,
	  voice varchar,
	  created timestamp DEFAULT CURRENT_TIMESTAMP
	);
	`;
	// create our temp table
	client.query(createTableText, function(err) {
		if (err) throw err;
		console.log('postgresql: clips table initialized');
	});
}

function logger() {
	return function(req, res, next) {
		console.log(req.path);
		next();
	};
}