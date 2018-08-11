module.exports=(sequelize,DataTypes) =>{
    const user = sequelize.define('user',
        {
            id:
            {
                type: DataTypes.INTEGER,
                primaryKey: true,
                unique: true,
                autoIncrement: true,
                required: true
            },
            createdAt:false,
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
                defaultsTo:0
            }
        });i
    user.associate = function(models)
    {
        models.user.hasMany(models.like,
        {
            onDelete:'cascade'
        });
    };
    	user.beforeCreate((user) => {
		return bcrypt.hash(user.password,10).then(hashedPw => {
			user.password = hashedPw;
		});
	});

    return user;
        
    
};
