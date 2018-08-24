const bcrypt = require("bcrypt");
module.exports = (sequelize, DataTypes) => {
    const user = sequelize.define('user', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            unique: true,
            autoIncrement: true,
            required: true
        },
        username: {
            type: DataTypes.STRING,
            unique: true,
            required: true,
            validate: {
                len: [4, 32]
            }
        },
        password: {
            type: DataTypes.STRING,
            required: true,
            protect: true,
            //Evil regex?
            validate: {
                len: [4, 32]
            }

        },
        likedByCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }

    });
    user.associate = function (models) {
        models.user.hasMany(models.like, {
            onDelete: 'cascade'
        });
    };
    user.beforeCreate((user) => {
        return bcrypt.hash(user.password, 10).then(hashedPw => {
            console.log(user.password + " hash " + hashedPw);
            user.password = hashedPw;
        });
    });
    user.beforeUpdate((user) => {
        return bcrypt.hash(user.password, 10).then(hashedPw => {
            console.log(user.password + " hash " + hashedPw);
            user.password = hashedPw;
        });

    });

    return user;


};