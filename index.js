var express = require('express');
const Sequelize = require('sequelize');
var bodyParser = require('body-parser');
var routes = require('./routes/routes.js');
var app = express();
const database = new Sequelize("postgres://popmmtnk:k4p7M5zyk6VhgC_pr8PimC1PFQ4l_nxp@horton.elephantsql.com:5432/popmmtnk");
//Lets us parse request bodies(important for POST)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
routes(app);
var server = app.listen(1337,function(){
   console.log("Server running on" + server.address() + ":" + server.address().port); 
});

