module.exports = (sequelize,DataTypes) =>{
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
                    alowNull: false
                }
            });
    };
    return like;

};
