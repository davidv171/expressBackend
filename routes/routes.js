var models = require("../models/index.js");
module.exports=function(app){
	app.post("/api/signup",async function(req,res){
        await models.user.create(
            {
                username:req.body.username,
                password:req.body.password
            })
			.then(function(user){
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
        models.user.findOne({where:{username:target_username}})
			.then(function(user){
			const bcrypt = require("bcrypt");
			bcrypt.compare(target_pass,user.password,function(err,result){
				console.log("res"+result);
				if(result){res.status(200).json({succ:"succ"})};
				if(!result){res.status(400).json({err:"err"})};
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
	app.get("/api/most-liked",function(req,res){
   
	});
	app.get("*",function(req,res){
		res.status(404).json({status:"Nonexisting request"});
	});
    
};

