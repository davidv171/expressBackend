var models = require("../models/index.js");
var bcrypt = require("bcrypt");
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
			}).catch((err) => res.status(500).json({err:err.message})); 
	});
	app.post("/api/login",async function(req,res){
		const target_username = req.body.username;
		const target_pass = req.body.password;
		//Find the user with the username in the request,check the password in the request with the hashed password using bcrypt
		models.user.findOne({where:{username:target_username}})
			.then(function(user){
				//TODO: Better responses for success and error 
				bcrypt.compare(target_pass,user.password,function(err,result){
					if(result){res.status(200).json({succ:"succ"});}
					if(!result){res.status(400).json({err:"err"});}
				});			
				//TODO: Fix up the error handling
			}).catch((err) => res.status(500).json({err:err}));
        
	
	});
	app.get("/api/me",function(req,res){
	        
	});

	app.put("/api/me/update-password",function(req,res){
	    
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
	app.get("/api/user/:id/like",function(req,res){
    
	});
	app.get("/api/user/:id/unlike",function(req,res){
        
	});
	app.get("/api/most-liked",async function(req,res){
	    await models.user.findAll({order:[["likedByCount","DESC"]]})
		.then(function(user){
		    res.status(200).json({status:"Success",leaderBoard:user});
		}).catch((err) => res.status(500).json({err:err.message}));
	        

	    });
	app.get("*",function(req,res){
		res.status(404).json({status:"Nonexisting request"});
	});
    
};

