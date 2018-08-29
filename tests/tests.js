var express = require('express');
const request = require('supertest');
var bodyParser = require('body-parser');
var routes = require('../routes/routes.js');
var app = express();
var random1 =  Math.random().toString(15).substring(7);

//Lets us parse request bodies(important for POST)
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
routes(app);
var server = app.listen(4200, async function () {
    console.log("Test server running on" + server.address() + ":" + server.address().port);
   //Wait for 5 seconds to avoid sync clashes
    setTimeout(function() {
        mostliked().then(()=>successfulSignup().then((passwordTooShort().then(()=>usernameTooLong().then(()=>userAlreadyExists())))));
    }, 5000);


async function mostliked(){
    console.log("---------------------MOSTLIKED-----------------------------------")
   return await request(app)
    .get('/api/most-liked')
    .expect(200)
}
async function successfulSignup(){
   return await request(app)
    .post('/api/signup')
    .send({username: random1,password:"test"})
    .set('Accept', 'application/json')
    .expect(200)

}
async function passwordTooShort(){
    return await request(app)
    .post('/api/signup')
    .send({username: "aaa",password:"aaa"})
    .set('Accept', 'application/json')
    .expect(400)
    .expect({err:'Invalid input',status: 'Password or username is too short/long(must be longer than 4 characters, shorter than 32)'})

}
async function usernameTooLong(){
    return await request(app)
    .post('/api/signup')
    .send({username: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",password:"aaa"})
    .set('Accept', 'application/json')
    .expect(400)
    .expect({err:'Invalid input',status: 'Password or username is too short/long(must be longer than 4 characters, shorter than 32)'})

}
async function userAlreadyExists(){
    console.log("---------------------UserEXISTSCheck-----------------------------------")
    return await request(app)
            .post('/api/signup')
            .send({username: random1,password:"test"})
            .set('Accept', 'application/json')
            .expect(400)
            .expect({err: 'Invalid input',status: 'Username already exists!'})
            //We can't check response body because we don't know what ID will be given
}
async function successfulLogin(){}
async function falseCredentials(){}
async function succesfulMe(){}
async function falseJWT(){}
async function noJWT(){}
async function successfulUpdatePassword(){}
async function successfulProfile(){}
async function nonexistingProfile(){}
async function successfulLike(){}
async function likingYourself(){}
async function nonexistingLike(){}
async function alreadyLiked(){}
async function successfulUnlike(){}
async function unlikingYourself(){}
async function nonexistingUnlike(){}
async function alreadyUnliked(){}
});