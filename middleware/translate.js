var models = require("../models/index.js");

module.exports ={
    translate:  (async (req,res,next)=>{
    	//This allows us to type in a username or an id in the URL and the backend returning the same user object
	//TODO: Check edge cases on this
		//TODO: Think if it's better to just put a user object into res.locals* instead of just certain parameters
		try{
		if (isNaN(req.params.id)) {
			user = await models.user.findOne({
				where: {
					username: req.params.id
				}
			});
				//Using res.locals to save potential redos of findById
				if(!user){
					res.status(400).json({
					err: "User doesnt exist",
					status: "The username or id you've requested does not exist"});
				}
                if(user){
                res.locals.user = user

                next();
                }
		}
		if (!isNaN(req.params.id)) {
			user = await models.user.findById(req.params.id)
					//Using res.locals to save potential redos of findById
					if(!user){
						res.status(400).json({
						err: "User doesnt exist",
						status: "The username or id you've requested does not exist"});}
					if(user){ 
                        res.locals.user = user
                        next();
                    
                    }				
		}
	}catch(err){
		if (err.name === "TypeError") res.status(400).json({
		err: "User doesnt exist",
		status: "The username or id you've requested does not exist"
	});


	}
})
}