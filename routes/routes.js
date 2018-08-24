var models = require("../models/index.js");
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
module.exports = function (app) {
	app.post("/api/signup", async function (req, res) {
		await models.user.create({
				username: req.body.username,
				password: req.body.password
			})
			.then(async function (user) {
				//Refresh user because sequelize doesnt apply defaultScope otherwise :)
				//Not applying defaultScope returns hashed user password!
				user = await user.reload();
				res.status(200).json({
					status: "success",
					result: user
				});
			}).catch((err) => {
				console.log("Error name" + err.name);
				if (err.name === "SequelizeUniqueConstraintError") res.status(400).json({
					err: 'Invalid input',
					status: 'Username and password exists'
				})
				if (err.name === "SequelizeValidationError") res.status(400).json({
					err: 'Invalid input',
					status: 'Password or username is too short(must be longer than 4 characters, shorter than 32)'
				});
				if (err.name === "SequelizeConnectionError") res.status(500).json({
					err: 'Database error',
					status: 'An error has occured with the database, try again later'
				});
				//TODO: Take down server if an unexpected error occurs
				else {};
			});
	});
	app.post("/api/login", async function (req, res) {
		const target_username = req.body.username;
		const target_pass = req.body.password;
		//Find the user with the username in the request,check the password in the request with the hashed password using bcrypt
		//Using allScope to return the password(hashed) of the user in the database
		models.user.scope("allScope").findOne({
				where: {
					username: target_username
				}
			})
			.then(function (user) {
				console.log(target_pass + "user" + user.password);
				//TODO: Better responses for success and error
				bcrypt.compare(target_pass, user.password, function (err, result) {
					//Username checked out
					if (err) res.status(500).json({
						err: "Bcrypt error",
						status: "There was an error with bcrypt compare"
					});
					//We check for actual boolean values, to avoid None result firing an authentication error instead of a bcrypt error
					if (result === true) {
						var token = jwt.sign({
								username: user.username,
								id: user.id,
								likedByCount: user.likedByCount
							},
							"S€cr€7", {
								expiresIn: "7d"
							});
						res.status(200).json({
							succ: "Success",
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
			}).catch((err) => {
					if (err.name === "TypeError") res.status(500).json({
						err: "Authentication error",
						status: "Credentials don't exist!"
					});
					else {};
				}


			);


	});
	//This allows us to type in a username or an id in the URL and the backend returning the same user object
	app.use('/api/user/:id', function (req, res, next) {
		//TODO: Think if it's better to just set up a user object instead of certain parameters
		if (isNaN(req.params.id)) {
			models.user.findOne({
				where: {
					username: req.params.id
				}
			}).then(function (user) {
				res.locals.username = req.params.id;
				res.locals.id = user.id;
				res.locals.likedByCount = user.likedByCount;
				next();
			}).catch((err) => res.status(400).json({
				err: "User doesnt exist",
				status: "The username or id you've requested does not exist"
			}));
		}
		if (!isNaN(req.params.id)) {
			models.user.findById(req.params.id)
				.then(function (user) {
					console.log("Username to be set" + user.username);
					res.locals.username = user.username;
					res.locals.id = req.params.id;
					res.locals.likedByCount = user.likedByCount;
					next();
				}).catch((err) => res.status(400).json({
					err: "User doesnt exist",
					status: "The username or id you've requested does not exist"
				}));
		}


	});
	//Don't re-do findOne
	app.get("/api/user/:id/", async function (req, res) {
		res.status(200).json({
			id: res.locals.id,
			username: res.locals.username,
			likedByCount: res.locals.likedByCount
		});
	});
	app.get("/api/most-liked", async function (req, res) {
		await models.user.findAll({
				order: [
					["likedByCount", "DESC"]
				]
			})
			.then(function (user) {
				res.status(200).json({
					status: "Success",
					leaderBoard: user
				});
				//Not much to catch here, except for a database error
			}).catch((err) => res.status(500).json({
				err: "Error receiving leaderboard",
				status: err.message
			}));


	});	
	//Authentication middleware, checks for correct jwt on all requests under this function!

	//New authenticated endpoints go after this point
	//__________________________________________________________________________________________
	app.use("/api/", function (req, res, next) {
		var token = req.body.token || req.headers.token;
		if (token) {
			jwt.verify(token, "S€cr€7", function (err, decoded) {
				if (err) return res.status(403).json({
					err: "Wrong token",
					status: "Unverifiable token"
				});
				req.decoded = decoded;
				return next();
			});
		} else {
			res.status(403).json({
				err: "No token",
				status: "Missing or unverifiable token!"
			});
		}
	});
	//Authenticated calls
	app.get("/api/me", async function (req, res) {
		//TODO: Think if its smart to use JWT for user info instead of querying 
		var decoded = req.decoded;
		res.status(200).json({
			//"Success" is printed out for potential future "Parial Success"
			succ: "Success",
			id: decoded.id,
			username: decoded.username,
			likedByCount: decoded.likedByCount
		});
	});

	app.post("/api/me/update-password", async function (req, res) {
		const newpass = req.body.password;
		const decoded = req.decoded;
		models.user.update({
			password: newpass
		}, {
			where: {
				id: decoded.id
			},
			//Trying not to return the password
			individualHooks: true
		}).then(async function (user) {
			//TODO: Clean up output!
			res.status(200).json({
				succ: "Success",
				result: user[0]
			});
		}).catch((err) => {
			console.log("Error name" + err.name);
			//Very edge case, but just in case we ever support deleting users or testing on a new database, requests will throw a type error, because user will be null
			if (err.name === "TypeError") res.status(400).json({
				err: 'Invalid input',
				status: 'User does not exist, are you using a deleted user token?'
			})
			if (err.name === "SequelizeUniqueConstraintError") res.status(400).json({
				err: 'Invalid input',
				status: 'Username and password exists'
			})
			if (err.name === "SequelizeValidationError") res.status(400).json({
				err: 'Invalid input',
				status: 'Password or username is too short(must be longer than 4 characters, shorter than 32)'
			});
			if (err.name === "SequelizeConnectionError") res.status(500).json({
				err: 'Database error',
				status: 'An error has occured with the database, try again later'
			});
			//TODO: Take down server if an unexpected error occurs
			else {};
		});
	});
	//TODO: Check if it's an id or a username that's in the request

	//Every time a user gets liked create a new Like entry, remove an existing entry when a 
	//TODO: Think about if like and unlike or authenticated calls belong in a separate file 
	app.get("/api/user/:id/like", async function (req, res) {
		//FIXME: if user gets deleted, he can still make requests with a JWT

		const target_id = res.locals.id;
		const target_username = res.locals.username;
		console.log("Target" + target_username);
		//TODO: Add username -> id and the other way logic
		const source_id = req.decoded.id;
		const source_username = req.decoded.username;
		if (target_id === source_id) {
			res.status(400).json({
				err: "Cant like yourself",
				status: "A user can only like other users, not himself"
			})
		};
		models.like.findOrCreate({
			where: {
				target: target_id,
				userId: source_id
			},
			defaults: {
				target_username: target_username,
				target: target_id,
				userId: source_id,
				source_username: source_username
			}
			//Result is an array of size 2,
			// first element is the found element second element is true or false, based on if  a new row was created or not
		}).then(function (result) {
			if (!result[1]) {
				res.status(400).json({
					err: "Already liked",
					status: "You've already liked this user!"
				})
			};
			if (result[1]) {
				res.status(200).json({
					status: "Success",
					result: result[0]
				})
				//Increment the likedByCount value by 1 each time there's a successful like
				//FIXME: Sequelize not doing what its told to do

			};
		}).catch((err) => res.status(500).json({
			err: err.message,
			status: "Unexpected errors"
		}));

	});
	//Opposite logic to liking
	app.get("/api/user/:id/unlike", async function (req, res) {
		const target_id = res.locals.id;
		//TODO: Add username -> id and the other way logic
		const source_id = req.decoded.id;
		if (target_id === source_id) {
			res.status(400).json({
				err: "Cant unlike yourself",
				status: "A user can only unlike other users, not himself"
			})
		};
		models.like.destroy({
			where: {
				target: target_id,
				userId: source_id
			}
		}).then(function (result) {
			if (result === 1) {
				res.status(200).json({
					succ: "success",
					result:result
				});

			}
			if (result === 0) {
				res.status(401).json({
					err: "Already unliked",
					status: "You already don't like this user"
				});
			}
		}).catch((err) => res.status(500).json({
			err: err.message
		}));
	});
	app.get("*", function (req, res) {
		res.status(404).json({
			status: "Nonexisting request"
		});
	});

};