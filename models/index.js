let fs        = require( 'fs' )
const path      = require( 'path' )
const Sequelize = require( 'sequelize' )
const basename  = path.basename( module.filename )
const env       = process.env.NODE_ENV || 'development'
const config = require(`${__dirname}/../api/config/config.json`)[env];

const db        = {}
//To prevent queries into USERS instead of User(which is what we want)
var opts = {
    define:{
        timestamps: false,
        freezeTableName:true,
	defaultScope: {
	    attributes: 
		{ 
		    exclude: ['password'] 
		}	
	}
    }
}

let sequelize
sequelize = new Sequelize("postgres://popmmtnk:k4p7M5zyk6VhgC_pr8PimC1PFQ4l_nxp@horton.elephantsql.com:5432/popmmtnk",opts)


fs
  .readdirSync( __dirname )
  .filter( function( file ) {
    return ( file.indexOf( '.' ) !== 0 ) && ( file !== basename ) && ( file.slice( -3 ) === '.js' )
  } )
  .forEach( function( file ) {
    var model = sequelize[ 'import' ]( path.join( __dirname, file ) )
    db[ model.name ] = model
  });

Object.keys( db ).forEach( function( modelName ) {
  if ( db[ modelName ].associate ) {
    db[ modelName ].associate( db )
  }
});

db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db
