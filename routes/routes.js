var user = require('../models/User.js');
module.exports=function(app){
    app.post('/api/signup',async function(req,res){
        var test = await user.testConnection();
        console.log(test);
    });
    app.post('/api/login',function(req,res){
    
    });
    app.get('api/login',function(req,res){

    });
    app.get('/api/me',function(req,res){
    
    });

    app.put('/api/me/update-password',function(req,res){
    
    });
    app.get('/api/user/:id/',function(req,res){
    
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

