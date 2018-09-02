var express = require("express");
const request = require("supertest");
var bodyParser = require("body-parser");
var routes = require("../routes/routes.js");
var jwt = require("jsonwebtoken");
var assert = require("assert");
var app = express();
var auth_routes = require("../routes/auth_routes.js");

var translate = require("../middleware/translate.js");
//Lets us parse request bodies(important for POST)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(["/api/user/:id/","api/user/:id/like","api/user/:id/unlike"],translate.translate);
//Generate two random usernames, random1 used for successful signups
var random1 = Math.random().toString(25).substring(5);
//random2 is subsequently used as a non-registered user!
var random2 = Math.random().toString(25).substring(6);
//random3 is used to create a different user that is then liked by the random1 username
var random3 = Math.random().toString(25).substring(5);
var randomJWT = jwt.sign({
	username: random1
},
"S€cr€7", {
	expiresIn: "7d"
});
//Lets us parse request bodies(important for POST)
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());
routes(app);
auth_routes(app);

var server = app.listen(4200, async function () {
	console.log("Test server running on" + server.address() + ":" + server.address().port);
	//Wait for 5 seconds to avoid Sequelize sync clashes
	setTimeout(async function () {
		//Some test cases depend on the previous one to be complete successfully
		//These are the test cases that depend on referencing the previously made user
		try{
			assert.ok(await successfulSignup(),"Successful signup failed");
			if (successfulSignup) {
				console.log(assert.ok(await userAlreadyExists(),"User already exists profile check failed"));
				assert.ok(await successfulProfile(),"Successful profile check failed");
				//We need a fully logged in user with none of these because we create a JWT based on the username not based on output
				assert.ok(await successfulLogin(),"Successful login check failed");
				assert.ok(await successfulUpdatePassword(),"Successful update password check failed");
				assert.ok(await successfulMe(),"Successful me check failed");
				assert.ok(await likingYourself(),"Liking yourself check failed");
				assert.ok(await unlikingYourself(),"Unliking yourself error");
				successfulSecondSignup = assert.ok(await successfulSecondSignup());
				//So that we may be able to like a user, we need both successfulSignup and successfulSecondSignup
				if (successfulSecondSignup) {
					successfulLike = assert.ok(await successfulLike(),"Successful like check fail");
					//To be able to re-like a user, unlike him we need a user random1 to like random2
					if (successfulLike) {
						alreadyLiked = assert.ok(await alreadyLiked(),"Successful like check");
						if (alreadyLiked) {
							successfulUnlike = assert.ok(await successfulUnlike(),"Successful unlike check");
							if (successfulUnlike) {
								assert.ok(await alreadyUnliked(),"Already unliked check");
							}
						}
					}
				}
			} 
			assert.ok(await mostliked(),"Most liked check failed!");
			assert.ok(await passwordTooShort(),"Password too short check failed!");
			assert.ok(await usernameTooLong(),"Username too long check failed!");
			assert.ok(await falseCredentials(),"False credentials check failed!");
			assert.ok(await falseJWT(),"False JWT check failed");
			assert.ok(await noJWT(),"No JWT check failed");
			assert.ok(await nonexistingProfile(),"Nonexisting profile check failed");
			assert.ok(await nonexistingLike(),"NonexistingLike check failed!");
			assert.ok(await nonexistingUnlike(),"Nonexisting unlike failed!");
		}catch(err){console.log(err);}

	}, 5000);



});
async function mostliked() {
	console.log("---------------------MOSTLIKED-----------------------------------");
	return await request(app)
		.get("/api/most-liked")
		.expect(200);
}
async function successfulSignup() {
	console.log("---------------------SuccessfulSignup-----------------------------------");
	return await request(app)
		.post("/api/signup")
		.send({
			username: random1,
			password: "test"
		})
		.set("Accept", "application/json")
		.expect(200);

}
async function successfulSecondSignup() {
	console.log("---------------------SuccessfulSignup-----------------------------------");

	return await request(app)
		.post("/api/signup")
		.send({
			username: random3,
			password: "test"
		})
		.set("Accept", "application/json")
		.expect(200);

}
async function passwordTooShort() {
	console.log("---------------------Password too short-----------------------------------");

	return await request(app)
		.post("/api/signup")
		.send({
			username: "aaa",
			password: "aaa"
		})
		.set("Accept", "application/json")
		.expect(400)
		.expect({
			err: "Invalid input",
			status: "Password or username is too short/long(must be longer than 4 characters, shorter than 64)"
		});

}
async function usernameTooLong() {
	return await request(app)
		.post("/api/signup")
		.send({
			username: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			password: "aaa"
		})
		.set("Accept", "application/json")
		.expect(400)
		.expect({
			err: "Invalid input",
			status: "Password or username is too short/long(must be longer than 4 characters, shorter than 64)"
		});

}
async function userAlreadyExists() {
	console.log("---------------------UserEXISTSCheck-----------------------------------");
	return await request(app)
		.post("/api/signup")
		.send({
			username: random1,
			password: "test"
		})
		.set("Accept", "application/json")
		.expect(400)
		.expect({
			err: "Invalid input",
			status: "Username already exists!"
		});
	//We can't check response body because we don't know what ID will be given
}
async function successfulLogin() {
	console.log("---------------------status login-----------------------------------");

	return await request(app)
		.post("/api/login")
		.send({
			username: random1,
			password: "test"
		})
		.set("Accept", "application/json")
		.expect(200);
}
async function falseCredentials() {
	console.log("-----------------------------False credentials -----------------------------------");
	return await request(app)
		.post("/api/login")
		.send({
			username: random2,
			password: "test"
		})
		.set("Accept", "application/json")
		.expect(400)
		.expect({
			err: "Authentication error",
			status: "Credentials don't exist!"
		});
}
async function successfulMe() {
	console.log("---------------------Successful me-----------------------------------");
	return await request(app)
		.get("/api/me")
		.set({
			"token": randomJWT
		})
		.set("Accept", "application/json")
		.expect(200);
}
async function falseJWT() {
	console.log("---------------------False JWT-----------------------------------");
	return await request(app)
		.get("/api/me")
		.set({
			"token": randomJWT + "y"
		})
		.set("Accept", "application/json")
		.expect(403)
		.expect({
			err: "Wrong token",
			status: "Unverifiable token"
		});
}
async function noJWT() {
	console.log("---------------------No JWT-----------------------------------");
	return await request(app)
		.get("/api/me")
		.set({
			"token": ""
		})
		.set("Accept", "application/json")
		.expect(403)
		.expect({
			err: "No token",
			status: "Missing or unverifiable token!"
		});
}
async function successfulUpdatePassword() {
	console.log("---------------------Successful update password-----------------------------------");
	return await request(app)
		.post("/api/me/update-password")
		.set({
			"token": randomJWT
		})
		.send({
			password: "updatedPass"
		})
		.set("Accept", "application/json")
		.expect(200)
		.expect({
			status: "Success",
		});
}
async function successfulProfile() {
	//Testing the created user because he is the only known one
	console.log("---------------------Successful profile-----------------------------------");
	return await request(app)
		.get("/api/user/" + random1)
		.set("Accept", "application/json")
		.expect(200);
}
async function nonexistingProfile() {
	console.log("---------------------Nonexisting profile-----------------------------------");
	return await request(app)
		.get("/api/user/" + random2)
		.set("Accept", "application/json")
		.expect(400)
		.expect({
			err: "User doesnt exist",
			status: "The username or id you've requested does not exist"
		});
}
async function successfulLike() {
	console.log("---------------------Successful like-----------------------------------");
	return await request(app)
		.get("/api/user/" + random3 + "/like")
		.set({
			"token": randomJWT
		})
		.set("Accept", "application/json")
		.expect({
			status: "Success",
			liked: random3
		})
		.expect(200);

}
async function likingYourself() {
	console.log("---------------------Liking yourself-----------------------------------");

	return await request(app)
		.get("/api/user/" + random1 + "/like")
		.set({
			"token": randomJWT
		})
		.set("Accept", "application/json")
		.expect(400)
		.expect({
			err: "Cant like yourself",
			status: "A user can only like other users, not himself"
		});
}
async function nonexistingLike() {
	console.log("---------------------Nonexisting like-----------------------------------");
	return await request(app)
		.get("/api/user/" + random2 + "/like")
		.set({
			"token": randomJWT
		})
		.set("Accept", "application/json")
		.expect(400)
		.expect({
			err: "User doesnt exist",
			status: "The username or id you've requested does not exist"
		});
}
async function alreadyLiked() {
	console.log("---------------------Already liked-----------------------------------");
	return await request(app)
		.get("/api/user/" + random3 + "/like")
		.set({
			"token": randomJWT
		})
		.set("Accept", "application/json")
		.expect(400)
		.expect({
			err: "Already liked",
			status: "You've already liked this user!"
		});
}
async function successfulUnlike() {
	console.log("---------------------Successful unlike-----------------------------------");
	return await request(app)
		.get("/api/user/" + random3 + "/unlike")
		.set({
			"token": randomJWT
		})
		.set("Accept", "application/json")
		.expect(200)
		.expect({
			status: "Success",
			unliked: random3
		});
}
async function unlikingYourself() {
	console.log("---------------------Unliking yourself-----------------------------------");
	return await request(app)
		.get("/api/user/" + random1 + "/unlike")
		.set({
			"token": randomJWT
		})
		.set("Accept", "application/json")
		.expect(400)
		.expect({
			err: "Cant unlike yourself",
			status: "A user can only unlike other users, not himself"
		});
}
async function nonexistingUnlike() {

	console.log("---------------------Nonexisting unlike-----------------------------------");
	return await request(app)

		.get("/api/user/" + random2 + "/unlike")
		.set({
			"token": randomJWT
		})
		.set("Accept", "application/json")
		.expect(400)
		.expect({
			err: "User doesnt exist",
			status: "The username or id you've requested does not exist"
		});
}
async function alreadyUnliked() {
	console.log("---------------------Already unliked-----------------------------------");
	return await request(app)
		.get("/api/user/" + random3 + "/unlike")
		.set({
			"token": randomJWT
		})
		.set("Accept", "application/json")
		.expect(400)
		.expect({
			err: "Already unliked",
			status: "You already don't like this user"
		});
}
