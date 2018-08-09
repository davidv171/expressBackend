var models = require('../models/index.js');
module.exports=function(app){
    app.post('/api/signup',async function(req,res){
       models.user.create({username:req.body.username,password:req.body.password})
        .then(function(user){
            res.status(200).json({id:user.id});
        }).catch((err) => res.status(500).json({err:err})); 
    });
    app.post('/api/login',function(req,res){
    
    });
    app.get('/api/me',function(req,res){
    
    });

    app.put('/api/me/update-password',function(req,res){
    
    });
    app.get('/api/user/:id',function(req,res){
        const target_id = req.params.id;
        models.user.findOne({where:{id:target_id}})
            .then(function(user){
                res.status(200).json({id:target_id});
            //TODO: Fix up the error handling
            }).catch((err) => res.status(500).json({err:err}));
            
    });
    app.get('/api/user/:id/like',function(req,res){
    
    });
    app.get('/api/user/:id/unlike',function(req,res){
        
    });
    app.get('/api/most-liked',function(req,res){
   
    });
    app.get('*',function(req,res){
        res.status(404).json({status:"Nonexisting request"});
    });
    
};

