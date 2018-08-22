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
				user = await user.reload();
				res.status(200).json({
					status: "success",
					result: user
				});
			}).catch((err) => res.status(500).json({
				err: err.message
			}));
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
					console.log("Result" + result);
					if (result) {
						var token = jwt.sign({
								username: user.username,
								id: user.id,
								likedByCount: user.likedByCount
							},
							"S€cr€7", {
								expiresIn: "7d"
							});
						res.status(200).json({
							succ: "succ",
							token: token
						});
					}
					if (!result) {
						res.status(400).json({
							err: "err"
						});
					}
				});
				//TODO: Fix up the error handling
			}).catch((err) => res.status(500).json({
				err: err.message
			}));


	});
	app.get("/api/user/:id", async function (req, res) {
		const target_id = req.params.id;
		await models.user.findOne({
				where: {
					id: target_id
				}
			})
			.then(function (user) {
				res.status(200).json({
					id: user.id,
					username: user.username,
					likedByCount: user.likedByCount
				});
				//TODO: Fix up the error handling
			}).catch((err) => res.status(500).json({
				err: err
			}));

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
			}).catch((err) => res.status(500).json({
				err: err.message
			}));


	});
	//Is authenticated middleware, checks for correct jwt 
	app.use(function (req, res, next) {
		var token = req.body.token || req.headers.token;
		if (token) {
			jwt.verify(token, "S€cr€7", function (err, decoded) {
				if (err) return res.status(403).json({
					err: err
				});
				req.decoded = decoded;
				return next();
			});
		} else {
			res.status(403).json({
				err: "Token not provided"
			});
		}
	});
	//Authenticated calls
	app.get("/api/me", async function (req, res) {
		//Think if its smart to print out JWT instead of querying 
		var decoded = req.decoded;
		res.status(200).json({
			id: decoded.id,
			username: decoded.username,
			likedByCount: decoded.likedByCount
		});
	});

	app.put("/api/me/update-password", async function (req, res) {
		const newpass = req.body.password;
		const decoded = req.decoded;
		models.user.update({
			password: newpass
		}, {
			where: {
				id: decoded.id
			},
			individualHooks: true
		}).then(function (user) {
			user = user.reload();
			res.status(200).json(user);
		}).catch((err) => res.status(500).json({
			err: err.message
		}));
	});
	//Every time a user gets liked create a new Like entry, remove an existing entry when a 
	app.get("/api/user/:id/like", async function (req, res) {
		//FIXME: if user gets deleted, he can still make requests with a JWT
		const target_id = req.params.id;
		const target_username = req.params.username;
		//TODO: Add username -> id and the other way logic
		const source_id = req.decoded.id;
		const source_username = req.decoded.username;
		console.log("Source" + source_id);
		if (target_id === source_id) {
			res.status(400).json({
				err: "Cant like yourself"
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
			if (result[1] = false) {
				res.status(400).json({
					err: "Already liked"
				})
			};
			if (result[1] = true) {
				res.status(200).json({
					status: "succ",
					result: result[0]
				})
			};
		}).catch((err) => res.status(500).json({
			err: err.message
		}));
	});
	//Opposite logic to liking
	app.get("/api/user/:id/unlike", function (req, res) {
		const target_id = req.params.id;
		const target_username = req.params.username;
		//TODO: Add username -> id and the other way logic
		const source_id = req.decoded.id;
		const source_username = req.decoded.username;

		if (target_id === source_id) {
			res.status(400).json({
				err: "Cant like yourself"
			})
		};
		models.like.destroy({
			where: {
				target: target_id,
				userId: source_id
			}
		}).then(function (result) {
			console.log("Deletion result" + result);
			if (result === 1) {
				res.status(200).json({
					succ: "success"
				});
			}
			if (result === 0) {
				res.status(401).json({
					err: "Already unliked"
				});
			}
			res.status(500).json({
				succ: result
			});
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