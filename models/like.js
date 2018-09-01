const moduleFile = require("../models/index.js");
module.exports = (sequelize, DataTypes) => {
	sequelize
		.sync({
		})
		.then(function (err) {
			console.log("Sync successful");
		}, function (err) {
			console.log("An error occurred while creating the table:", err);
		});
	const like = sequelize.define("like", {
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
	"";
	//Update the field likedByCount of target user by +1, update the field likes of source user by 1
	like.afterCreate(async (like) => {
		//Because Sequelize Increment seems to have an issue, we resort to writing the SQL sentence by hand. 
		try {
			user = await sequelize.query("UPDATE \"user\" SET \"likedByCount\"=\"likedByCount\"+ 1 WHERE \"id\"=" + like.target);
			if (user) console.log("Updated");
		} catch (err) {
			console.log("error" + err.message);
		}

	});
	like.afterDelete((like) => {
		//TODO: Change with update if you figure out how to import the user model object here:
		//someModel.update( { clicks : sequelize.literal( "clicks  -1" ) } ) )
		try {
			user = sequelize.query("UPDATE \"user\" SET \"likedByCount\"=\"likedByCount\"+ -1 WHERE \"id\"=" + like.target);
			if (user) console.log("Updated");
		} catch (err) {
			console.log("error" + err.message);
		}
	});


	return like;

};