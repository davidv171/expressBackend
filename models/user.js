const bcrypt = require("bcrypt");
module.exports=(sequelize,DataTypes) =>{
    //TODO Create explicit migration
    const user = sequelize.define("user",
		{
			id:
            {
            	type: DataTypes.INTEGER,
            	primaryKey: true,
            	unique: true,
            	autoIncrement: true,
            	required: true
            },
			username:
            {
            	type: DataTypes.STRING,
            	unique: true,
            	required:true
            },
			password:{
				type: DataTypes.STRING,
				required:true,
				protect:true
                
			},
			likedByCount:
            {
            	type: DataTypes.INTEGER,
            	defaultValue:0
            }
		});
	user.associate = function(models)
	{
		models.user.hasMany(models.like,
			{
				onDelete:"cascade"
			});
	};
	user.beforeCreate((user) => {
		return bcrypt.hash(user.password,10).then(hashedPw => {
			user.password = hashedPw;
		});
	});    
	return user;
};
