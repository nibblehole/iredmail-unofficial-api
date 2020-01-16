const express = require('express');
const router = express.Router();
const fs = require('fs');
const connection = require('../config/database').promise();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const privKey = fs.readFileSync('jwtRS256.key');

router.get('/', (req, res) => {
	res.json('Send a post request to this page for authorization');
});

router.post('/', async (request, response) => {
	const { userName, password } = request.body;

	if (typeof userName === 'undefined' || typeof password === 'undefined') {
		response.json('Invalid or missing values');
	}

	try {
		const [rows] = await connection.execute('SELECT * FROM `users` WHERE `userName` = ?', [userName]);

		if (rows != '') {
			bcrypt.compare(password, rows[0].password, (err, result) => {
				if (result) {
					console.log('Authentication was successful');
					jwt.sign(
						{
							exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
							user: rows[0].userName
						},
						privKey,
						{ algorithm: 'RS256' },
						(err, token) => {
							if (err) {
								response.json('Error occured when generating token');
							} else {
								response.json({ token });
							}
						}
					);
				} else {
					response.json('Incorrect Password');
				}
			});
		} else {
			response.json('No user found');
		}
	} catch (e) {
		console.log('Failed to authenticate ' + e);
		response.json('An error has occured, try again later');
	}
});

module.exports = router;
