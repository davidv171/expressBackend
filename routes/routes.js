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
			console.log("Error name" + err.name);
			if (err.name === "SequelizeUniqueConstraintError") res.status(400).json({
				err: 'Invalid input',
				status: 'Username already exists!'
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
	//This allows us to type in a username or an id in the URL and the backend returning the same user object
	//TODO: Check edge cases on this
	app.use('/api/user/:id', async (req, res, next) => {
		//TODO: Think if it's better to just put a user object into res.locals* instead of just certain parameters
		try{
		if (isNaN(req.params.id)) {
			user = await models.user.findOne({
				where: {
					username: req.params.id
				}
			});
				//Using res.locals to save potential redos of findById
				res.locals.username = req.params.id;
				res.locals.id = user.id;
				res.locals.likedByCount = user.likedByCount;
				next();

		}
		if (!isNaN(req.params.id)) {
			user = await models.user.findById(req.params.id)
					//Using res.locals to save potential redos of findById
					res.locals.username = user.username;
					res.locals.id = req.params.id;
					res.locals.likedByCount = user.likedByCount;
					next();
				
		}
	}catch(err){ res.status(400).json({
		err: "User doesnt exist",
		status: "The username or id you've requested does not exist"
	});


	}});
	//Don't re-do findOne, because the middleware above takes care of it!
	app.get("/api/user/:id/", async (req, res) => {
		res.status(200).json({
			id: res.locals.id,
			username: res.locals.username,
			likedByCount: res.locals.likedByCount
		});
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
	//Authentication middleware, checks for correct jwt on all requests under this function!

	//New authenticated endpoints go after this point
	//__________________________________________________________________________________________
	app.use("/api/", (req, res, next) => {
		var token = req.body.token || req.headers.token;
		if (token) {
			jwt.verify(token, "S€cr€7", (err, decoded) => {
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
	app.get("/api/me", async (req, res) => {
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

	app.post("/api/me/update-password", async (req, res) => {
		const newpass = req.body.password;
		const decoded = req.decoded;
		//Because upsert doesn't work like we want it to, we use update, and return the first(and only user)
		try{
		user = await models.user.update({
			password: newpass
		}, {
			where: {
				id: decoded.id
			},
			//Trying not to return the password
		})
			//TODO: Clean up output!
			res.status(200).json({
				succ: "Success",
				result: user[0]
			});
		}catch(err){
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
		}
	});
	//TODO: Check if it's an id or a username that's in the request

	//Every time a user gets liked create a new Like entry, remove an existing entry when a 
	//TODO: Think about if like and unlike or authenticated calls belong in a separate file 
	app.get("/api/user/:id/like", async (req, res) => {
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
		try{
		like = await models.like.findOrCreate({
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
		});
			if(!like[1]) {
				res.status(400).json({
					err: "Already liked",
					status: "You've already liked this user!"
				})
			};
			if (like[1]) {
				res.status(200).json({
					status: "Success",
					liked: target_id
				})
				//Increment the likedByCount value by 1 each time there's a successful like
			};
		}catch(err){res.status(500).json({
			err: err.message,
			status: "Unexpected error"
		})};

	});
	//Opposite logic to liking
	app.get("/api/user/:id/unlike", async (req, res) => {
		const target_id = res.locals.id;
		//TODO: Add username -> id and the other way logic
		const source_id = req.decoded.id;
		if (target_id === source_id) {
			res.status(400).json({
				err: "Cant unlike yourself",
				status: "A user can only unlike other users, not himself"
			})
		};
		try{
		like = await models.like.destroy({
			where: {
				target: target_id,
				userId: source_id
			}
		})
			if (like === 1) {
				res.status(200).json({
					succ: "Success",
					unliked: target_id
				});

			}
			if (like === 0) {
				res.status(401).json({
					err: "Already unliked",
					status: "You already don't like this user"
				});
			}
		}catch(err){res.status(500).json({
			err: err.message,
			status: "Unexpected error"
		})}
	});
	app.get("*", (req, res) => {
		res.status(404).json({
			err: "Nonexisting request",
			status: "This request "
		});
	});

};