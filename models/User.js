const sequelize = require('sequelize');
const seq = new sequelize("postgres://popmmtnk:k4p7M5zyk6VhgC_pr8PimC1PFQ4l_nxp@horton.elephantsql.com:5432/popmmtnk")
module.exports={
    testConnection: async function(){
        try{
            seq.authenticate(await function(err){
                if(err){
                    console.log("Err");
                    return err;
                }
                console.log("Success");
                return "succ";
            
            return "succ";
            });
        }catch(e){
        
        }    
    }

}
