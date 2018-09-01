var express = require("express");
var bodyParser = require("body-parser");
var routes = require("./routes/routes.js");
var auth_routes = require("./routes/auth_routes.js");
var translate = require("./middleware/translate.js");
var app = express();
//Lets us parse request bodies(important for POST)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/api/user/:id",translate.translate);
routes(app);
auth_routes(app);
var server = app.listen(1337,function(){
	console.log("Server running on" + server.address() + ":" + server.address().port); 
});

