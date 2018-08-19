module.exports = (sequelize,DataTypes) =>{
    sequelize 
    .sync()
    .then(function(err) {
        console.log('It worked!');
      }, function (err) { 
             console.log('An error occurred while creating the table:', err);
      });
    const like = sequelize.define('like',
        {
            id:{
                type: DataTypes.INTEGER,
                primaryKey: true,
                unique: true,
                autoIncrement: true,
                required: true,
            },
            target_username:
            {
                type: DataTypes.STRING
            },
            source_username:
            {
                type: DataTypes.STRING
            },
            target:
            {
                type: DataTypes.INTEGER
            }

        });
    like.associate = function(models){
        models.like.belongsTo(models.user,
            {
                foreignKey:{
                    allowNull: false
                }
            });
    };


    return like;

};
