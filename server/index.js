/* global require, process, console, __dirname, exports */
'use strict';
const {Client} = require('pg');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();

exports.run = run;
run();
function run() {
	app.set('pgClient', getPGClient());

	app.use(express.static(path.join(__dirname, 'public')));
	app.use(logger());
	app.get('/phrases/:id', function(req, res) {
		var queryText = 'SELECT * FROM clips WHERE id = $1';
		app.get('pgClient').query(queryText, [req.params.id], function(err, result) {
			if (err || !result || !result.rows[0]) {
				return res.status(404).send({error: 'not found'});
			}
			return res.send(result.rows[0]);
		});
	});

	app.post('/save', bodyParser.json(), function(req, res) {
		var insertTxt = 'INSERT INTO clips(content, voice) VALUES($1, $2) RETURNING *';
		var values = [req.body.content, req.body.voice || ''];
		app.get('pgClient').query(insertTxt, values, function(err, result) {
			if (err) {
				return res.status(422).send({errors: 'Failed to save, lol'});
			}
			res.send(result.rows[0]);
		});
	});

	app.listen(process.env.PORT, function() {
		console.log('Dang web server ready for it at port', process.env.PORT);
	});

	process.on('SIGTERM', function() {
		console.log('exiting');
		process.exit();
	});
}

function getPGClient() {
	const client = new Client(process.env.DATABASE_URL);
	// console.log('dip');
	client.connect(function(err) {
		if (err) throw err;
		console.log('postgresql: connected');
		setupDB(client);
	});
	return client;
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