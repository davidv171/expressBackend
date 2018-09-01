var models = require("../models/index.js");
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
module.exports = (app) => {
	app.post("/api/signup", async (req, res) => {
		try {
			user = await models.user.create({
				username: req.body.username,
				password: req.body.password
			});
			//Refresh user because sequelize doesnt apply defaultScope otherwise :)
			//Not applying defaultScope returns hashed user password!
			user = await user.reload();
			res.status(200).json({
				status: "success",
				result: user
			});
		} catch (err) {
			if(err.name=== "NameError") res.status(400).json({err:"Invalid input",status:"No username and/or password specified"});
			if (err.name === "SequelizeUniqueConstraintError") res.status(400).json({
				err: 'Invalid input',
				status: 'Username already exists!'
			})
			if (err.name === "SequelizeValidationError") res.status(400).json({
				err: 'Invalid input',
				status: 'Password or username is too short/long(must be longer than 4 characters, shorter than 32)'
			});
			if (err.name === "SequelizeConnectionError") res.status(500).json({
				err: 'Database error',
				status: 'An error has occured with the database, try again later'
			});
			//TODO: Take down server if an unexpected error occurs
		}
	});
	app.post("/api/login", async (req, res) => {
		const target_username = req.body.username;
		const target_pass = req.body.password;
		//Find the user with the username in the request,check the password in the request with the hashed password using bcrypt
		//Using allScope to return the password(hashed) of the user in the database
		try{
		user = await models.user.scope("allScope").findOne({
				where: {
					username: target_username
				}
			});
				bcrypt.compare(target_pass, user.password, (err, result) => {
					//Username checked out
					if (err) res.status(500).json({
						err: "Bcrypt error",
						status: "There was an error with bcrypt compare"
					});
					//We check for actual boolean values, to avoid None result firing an authentication error instead of a bcrypt error
					//We dont jwt sign IDs for easier testing as the id is the only unknown variable in the response 
					if (result === true) {
						var token = jwt.sign({
								username: user.username
							},
							"S€cr€7", {
								expiresIn: "7d"
							});
						res.status(200).json({
							status: "Success",
							token: token
						});
					}
					//Password is false
					if (result === false) {
						res.status(400).json({
							err: "Authentication error",
							status: "Credentials dont exist!",

						});
					}
				});
				//TODO: Fix up the error handling
			}catch(err){
					if (err.name === "TypeError") res.status(400).json({
						err: "Authentication error",
						status: "Credentials don't exist!"
					});
					//Finding(findone) doesn't trigger validation, so no need to catch validation errors
					if (err.name === "SequelizeConnectionError") res.status(500).json({
						err: 'Database error',
						status: 'An error has occured with the database, try again later'
					});
				}

	});

	//Don't re-do findOne, because the middleware in translate.js above takes care of it!
	app.get("/api/user/:id/", async (req, res) => {
		res.status(200).json({user:res.locals.user});
	});
	app.get("/api/most-liked", async (req, res) => {
		try{
		user = await models.user.findAll({
				order: [
					["likedByCount", "DESC"]
				]
			})

				res.status(200).json({
					status: "Success",
					leaderBoard: user
				});
				//Not much to catch here, except for a database error
			}catch(err){res.status(500).json({
				err: "Error receiving leaderboard",
				status: err.message
			})};


	});
	
};
