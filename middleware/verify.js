var jwt = require("jsonwebtoken");
var models = require("../models/index.js");

module.exports={
    verify:  (async (req,res,next)=>{
//Authentication middleware, checks for correct jwt on all requests under this function!
	//Not secure to return stuff just because JWT is correct, but the user might not exist
    //A hacker might do brute force until he gets a response to crack the secret
        var token = req.body.token || req.headers.token;
        console.log("Verifying" + token);
		if (token) {
			jwt.verify(token, "S€cr€7",async (err, decoded) => {
				if (err) return res.status(403).json({
					err: "Wrong token",
					status: "Unverifiable token"
				});
				user = await models.user.findOne({where:{username:decoded.username}});
				if (user){
                    res.locals.decoded = user;next();}
				//Returning the same response to prevent the vulnerability described above this function
				if (!user) return res.status(403).json({
					err: "Wrong token",
					status: "Unverifiable token"
				});
			});
		} else {
			res.status(403).json({
				err: "No token",
				status: "Missing or unverifiable token!"
            });
        }


})
}