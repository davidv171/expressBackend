var verify = require("../middleware/verify.js");
var models = require("../models/index.js");
module.exports = (app) => {
	app.use("/api/",verify.verify);
	//Authenticated calls
	app.get("/api/me", async (req, res) => {
		//TODO: Think if its smart to use JWT for user info instead of querying 
		var decoded = res.locals.decoded;
		res.status(200).json({
			//"Success" is printed out for potential future "Parial Success"
			status: "Success",
			id: decoded.id,
			username: decoded.username,
			likedByCount: decoded.likedByCount
		});
	});

	app.post("/api/me/update-password", async (req, res) => {
		const newpass = req.body.password;
		//Because upsert doesn't work like we want it to, we use update, and return the first(and only user)
		try{
			user = await res.locals.decoded.update({
				password: newpass
			}, {
				where: {
					id: res.locals.decoded.id
				},
			//Trying not to return the password
			});
			//TODO: Clean up output!
			res.status(200).json({
				status: "Success",
				result: user[0]
			});
		}catch(err){
			//Very edge case, but just in case we ever support deleting users or testing on a new database, requests will throw a type error, because user will be null
			if (err.name === "TypeError") res.status(400).json({
				err: "Invalid input",
				status: "User does not exist, are you using a deleted user token?"
			});
			if (err.name === "SequelizeValidationError") res.status(400).json({
				err: "Invalid input",
				status: "Password or username is too short/long(must be longer than 4 characters, shorter than 32)"
			});
			if (err.name === "SequelizeConnectionError") res.status(500).json({
				err: "Database error",
				status: "An error has occured with the database, try again later"
			});
		}
	});
	//TODO: Check if it's an id or a username that's in the request

	//Every time a user gets liked create a new Like entry, remove an existing entry when a 
	//TODO: Think about if like and unlike or authenticated calls belong in a separate file 
	app.get("/api/user/:id/like", async (req, res) => {
		//FIXME: if user gets deleted, he can still make requests with a JWT
		const target_user = res.locals.user;
		const target_id = target_user.id;
		const target_username = target_user.username;
		console.log("Decoded" + res.locals.decoded);
		const source_id = res.locals.decoded.id;
		const source_username = res.locals.decoded.username;
		if (target_id === source_id) {
			res.status(400).json({
				err: "Cant like yourself",
				status: "A user can only like other users, not himself"
			});
		}
		else{
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
					});
				}
				if (like[1]) {
					res.status(200).json({
						status: "Success",
						liked: target_username
					});
				//Increment the likedByCount value by 1 each time there's a successful like
				}
			}catch(err){res.status(500).json({
				err: err.message,
				status: "Unexpected error"
			});}

		}});
	//Opposite logic to liking
	app.get("/api/user/:id/unlike", async (req, res) => {
		const target_id = res.locals.user.id;
		const target_username = res.locals.user.username;
		//TODO: Add username -> id and the other way logic
		const source_id = res.locals.decoded.id;
		if (target_id === source_id) {
			res.status(400).json({
				err: "Cant unlike yourself",
				status: "A user can only unlike other users, not himself"
			});
		}
		else{
			try{

				like = await models.like.destroy({
					where: {
						target: target_id,
						userId: source_id
					}
				});
				if (like === 1) {
					res.status(200).json({
						status: "Success",
						unliked: target_username
					});

				}
				if (like === 0) {
					res.status(400).json({
						err: "Already unliked",
						status: "You already don't like this user"
					});
				}
			}catch(err){
				console.log(err);
				res.status(500).json({
					err: err.message,
					status: "Unexpected error"
				});}
		}});
	app.get("*", (req, res) => {
		res.status(404).json({
			err: "Nonexisting request",
			status: "This request isnt defined"
		});
	});

};
