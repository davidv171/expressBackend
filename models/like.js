const moduleFile = require("../models/index.js");
module.exports = (sequelize, DataTypes) => {
    sequelize
        .sync()
        .then(function (err) {
            console.log('Sync successful');
        }, function (err) {
            console.log('An error occurred while creating the table:', err);
        });
    const like = sequelize.define('like', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            unique: true,
            autoIncrement: true,
            required: true,
        },
        target_username: {
            type: DataTypes.STRING
        },
        source_username: {
            type: DataTypes.STRING
        },
        target: {
            type: DataTypes.INTEGER
        }

    });
    //HasOne and BelongsTo insert the association key in different models from each other. 
    //HasOne inserts the association key in target model whereas BelongsTo inserts the association key in the source model.
    like.associate = function (models) {
        models.like.belongsTo(models.user, {
            foreignKey: {
                allowNull: false
            }
        });
    };
    ""
    //Update the field likedByCount of target user by +1, update the field likes of source user by 1
    like.afterCreate((like) => {
        console.log(moduleFile);
        const target_id = like.target_id;
        
        moduleFile.user.findById(target_id).then(user => {
             user.increment('likedByCount', {
                by: 1
            })
        }).catch((err)=>console.log("Decrement error" + err.message));
    });


    return like;

};