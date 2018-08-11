var express = require('express');
var bodyParser = require('body-parser');
var routes = require('./routes/routes.js');
var app = express();
//Lets us parse request bodies(important for POST)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
routes(app);
var server = app.listen(1337,function(){
   console.log("Server running on" + server.address() + ":" + server.address().port); 
});

