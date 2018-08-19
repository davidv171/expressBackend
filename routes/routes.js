var models = require("../models/index.js");
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
module.exports=function(app){
	app.post("/api/signup",async function(req,res){
		await models.user.create(
			{
				username:req.body.username,
				password:req.body.password
			})
			.then(async function(user){
				//Refresh user because sequelize doesnt apply defaultScope otherwise :) 
				user = await user.reload();
				res.status(200).json(
					{
						status:"success",
						result:user
					});
			}).catch((err) => res.status(500).json({err:err})); 
	});
	app.post("/api/login",async function(req,res){
		const target_username = req.body.username;
		const target_pass = req.body.password;
		//Find the user with the username in the request,check the password in the request with the hashed password using bcrypt
	    //Using allScope to return the password(hashed) of the user in the database
		models.user.scope("allScope").findOne({where:{username:target_username}})
			.then(function(user){
			    console.log(target_pass + "user" + user.password);
				//TODO: Better responses for success and error
				bcrypt.compare(target_pass,user.password,function(err,result){
				    console.log("Result" + result);
					if(result){
					    var token = jwt.sign({username:user.username,id:user.id,likedByCount:user.likedByCount},
							"S€cr€7",
							{expiresIn:"7d"});
					    res.status(200).json({succ:"succ",token:token});
					}
					if(!result){res.status(400).json({err:"err"});}
				});			
				//TODO: Fix up the error handling
			}).catch((err) => res.status(500).json({err:err.message}));
        
	
	});
    	app.get("/api/user/:id",async function(req,res){
		const target_id = req.params.id;
		await models.user.findOne({where:{id:target_id}})
			.then(function(user){
				res.status(200).json(
					{
						id:user.id,
						username:user.username,
						likedByCount:user.likedByCount
					}
				);
				//TODO: Fix up the error handling
			}).catch((err) => res.status(500).json({err:err}));
            
	});
	app.get("/api/most-liked",async function(req,res){
	    await models.user.findAll({order:[["likedByCount","DESC"]]})
			.then(function(user){
		    res.status(200).json({status:"Success",leaderBoard:user});
			}).catch((err) => res.status(500).json({err:err.message}));
	        

	    });
	//Is authenticated middleware, checks for correct jwt 
	app.use(function(req,res,next){
	    var token = req.body.token || req.headers.token;
	    if(token){
			jwt.verify(token,"S€cr€7",function(err,decoded){
		    if(err)return res.status(403).json({err:err});
		    req.decoded = decoded;
		    return next();
			});  
	    }else{
			res.status(403).json({err:"Token not provided"});
	    }
	});
	//Authenticated calls
	app.get("/api/me",async function(req,res){
	    //Think if its smart to print out JWT instead of querying 
	    var decoded = req.decoded;
	    res.status(200).json({
		    id:decoded.id,
		    username:decoded.username,
		    likedByCount:decoded.likedByCount
		});
	});

	app.put("/api/me/update-password",async function(req,res){
	    const newpass = req.body.password;
	    const decoded = req.decoded;
	    models.user.update({password:newpass},
			{	
				where:{id:decoded.id},
				individualHooks:true
			}
		).then(function(user){
		    res.status(200).json(user);
		}).catch((err) => res.status(500).json({err:err.message}));
	});
	//Every time a user gets liked create a new Like entry
	app.get("/api/user/:id/like",function(req,res){
	    
	});
	app.get("/api/user/:id/unlike",function(req,res){
        
	});
	app.get("*",function(req,res){
		res.status(404).json({status:"Nonexisting request"});
	});
    
};

