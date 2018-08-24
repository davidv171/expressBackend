# povioExpressRewrite

A rewrite of my previous node project(povioNode) using Express.js instead of Sails.js with an increased focus of non-redundant code

The code will try to be as similar to the original as possible, which is why the documentation will be much more minimal.

## Code architecture

Since express.js is used, there are less files and more hand-written code. Sequelize is responsible for /api/migrations, api/config/ and /api/seeders folders and files inside of that.

- /index.js
    - This file sets up the Express.js enviroment and prepares the server parameters
    - We launch the server by using `node index.js` on this file

- /routes/routes.js
    - Our backbone file, this is the file where all the routes, and all the other middleware is defined. 
    - This file might get split into two files in the future
    - The inner workings of this file will be explained further down

- /models/user.js
    - This is where the user model is defined. This file uses sequelize for all of its function
    - Makes use of certain life cycle hooks as well. Namely beforeCreate and beforeUpdate, that takes care of hashing passwords in a slightly cleaner manner.

- /models/like.js
    - This is where the like model is defined. It is structured similarly to the user.js file. 
    - The life cycle hooks, namely afterDelete and afterCreate use manually written SQL sentences, because of "interesting" behaviour of incrementing in Sequelize. 
    - This is where sequelize.sync() is defined, which takes care of "creating" the database in case it doesn't already exist. 

## What we're using 

The major technologies/frameworks/tools used are:

1. Express.js as the backend framework
2. ElephantSQL(online FREE postgresql database hosting tool)
3. Sequelize as the database communication framework
4. JWT is used to set up authentication, currently has minimal security, only uses a secret.
5. Bcrypt is used to hash+salt passwords and check logins 
6. json,body-parser

## How to run the code

Easiest and most fool proof way is the classic:

1. `cd ~/source-folder/`
2. `npm install`
3. `node index.js`
4. Check terminal output for error messages, look for "Sync successful
5. Test the endpoints out using a tool like Postman or cURL if you're feeling frisky


## Customizing the code

This is amateurish code, but if you want to use it as a base for something better, the first step is customizing the /models/index.js.

What you want to change is :

```js
sequelize = new Sequelize("postgres://popmmtnk:k4p7M5zyk6VhgC_pr8PimC1PFQ4l_nxp@horton.elephantsql.com:5432/popmmtnk",opts)
```
And set up your own database. I'll let you figure that out on your own using Sequelize's ~~awful~~ docs. The rest is up to reading the docs, reading comments and if things get really rough, opening an issue. 

Both models are pretty self explanatory because they're not using anything but the basics. Hooks will be explained in the ##REST Endpoints part


## REST endpoints:

### POST /signup

Sign up to the system(username and password). 

#### Request:

POST:

- username: username
- password: password

##### Request rules

- Username and password cannot start with a number
    - response: ```400 {err:'Invalid input',status:'Password or username invalid'}```
- Username and password must be longer than 4, shorter than 32"
    - response: ```400 {err:'Invalid input',status:'Password or username invalid'}```
- Username must not already exist in the entry or general error with the database
    - response: ```500 {err:e.name,info:'An error with the database adapter, user most likely exists'}```

Invalid input errors take priority over errors with existing usernames, because the server internally checks the input before querying the database.

##### Successful output

In case you have successfuly signed up the user, it generates the following response:
```
200 {status:'success',result:createdUser}
```

### POST /login

Log in an existing user with a password

#### POST request body:


- username: username
- password: password

##### Request rules

- POST body must not be empty
    - 400 ```{err:'Empty body',info:'POST request body empty'}```
- User credentials must be correct
    - 400 ```{err:'Wrong credentials',info:'User with these credentials does not exist'}```

##### Successful output

In case you have successfuly signed in the user, it generates the following response:

200 
```{status:'Success',token:jwt}```
  


### GET /me

Get the currently logged in user information. This call needs to be authenticated.

#### Request headers

- token : jwt

JWT: JSON Web Token you received when logging in. Token times out after **7 days**

### PUT /me/update-password

Change the logged in user's password.

### PUT Request body

- password : password

Same rules apply and error outputs apply as during signup.

#### Successful response

Example of a successful call:

http://127.0.0.1:1337/api/me/update-password

Response:

``` json

{
    "status": "success",
    "updated": "test2"
}


```

### /user/:id/

:id could be a user's username or a users id.

Lists the usernames and number of likes of a user. This is not an authenticated call, which is why the body can be empty.

Example of a request:

http://127.0.0.1:1337/api/10

or 

http://127.0.0.1:1337/api/david14

#### Successful response

``` json
{
    "status": "success",
    "username": "david14",
    "likes": 0,
    "likedByCount": 2
}
```
In which case the "likes" is the amount of people the user in question has liked.

"LikedByCount" is the amount of people that have been liked

### GET /user/:id/like

Likes the user in question. This call needs to be authenticated

Example:

/user/davidv171/like

This means the user that's logged in likes the user davidv171. 

Each user can like another user only once. 

#### GET request headers

Example of a good call:

http://127.0.0.1:1337/api/user/1/like

or 

http://127.0.0.1:1337/api/user/test2/like

GET Headers:

- token : jwt

#### Request rules

- You can't like yourself:
```json
{
    "err": "Liking yourself error",
    "status": "You cant like yourself",
    "code": 1747
}
```
- You can only like a existing user 

```json
{
    "err": "TypeError",
    "status": "An error with the database adapter,user most likely doesnt exist",
}
```
- You can't like a user you've already liked
```json
{
    "err": "Liking yourself error",
    "status": "You cant like yourself",
}
```
#### Successful response


```json
{
    "status": "Success"
}
```

### /user/:id/unlike

Unlike a user that the logged in user has previously liked.

#### GET request headers

Example of a good call:

http://127.0.0.1:1337/api/user/1/unlike

or 

http://127.0.0.1:1337/api/user/test2/unlike

GET Headers:

- token : jwt

#### Request rules

- You can't unlike yourself:
```json
{
    "err": "Liking yourself error",
    "status": "You cant like yourself",
}
```
- You can only unlike an existing user 

```json
{
    "err": "TypeError",
    "status": "An error with the database adapter,user most likely doesnt exist",
}
```
- You can't unlike a user you've already liked
```json
{
"err":"Already unliked error",
"status":"You have already liked this person",
}
```
#### Successful response

```json
{
    "status": "Successfully liked"
}
```

### GET /most-liked

List users in a most to least liked manner. 

Is not an authenticated calls and does not need any authentication.

Example:

http://127.0.0.1:1337/api/most-liked

#### Successful response

```json
{
    "leaderBoard": [
        {
            "id": 10,
            "username": "david14",
            "numberOfLikes": 2
        },
        {
            "id": 1,
            "username": "test",
            "numberOfLikes": 1
        },
        {
            "id": 4,
            "username": "test420",
            "numberOfLikes": 0
        },
        {
            "id": 5,
            "username": "test2",
            "numberOfLikes": 0
        },
        {
            "id": 6,
            "username": "test251",
            "numberOfLikes": 0
        },
        {
            "id": 7,
            "username": "test25115",
            "numberOfLikes": 0
        },
        {
            "id": 8,
            "username": "david",
            "numberOfLikes": 0
        },
        {
            "id": 9,
            "username": "david1",
            "numberOfLikes": 0
        },
        {
            "id": 11,
            "username": "david145",
            "numberOfLikes": 0
        },
        {
            "id": 12,
            "username": "david145151515151",
            "numberOfLikes": 0
        },
        {
            "id": 14,
            "username": "david1451515151514161",
            "numberOfLikes": 0
        },
        {
            "id": 15,
            "username": "david1451515151514161141414141",
            "numberOfLikes": 0
        },
        {
            "id": 16,
            "username": "test15161",
            "numberOfLikes": 0
        },
        {
            "id": 17,
            "username": "yaz21161",
            "numberOfLikes": 0
        },
        {
            "id": 18,
            "username": "gqa721",
            "numberOfLikes": 0
        },
        {
            "id": 19,
            "username": "vyq62",
            "numberOfLikes": 0
        },
        {
            "id": 20,
            "username": "david41",
            "numberOfLikes": 0
        },
        {
            "id": 2,
            "username": "test1",
            "numberOfLikes": 0
        }
    ]
}
```
## Tests

Postman takes care of 47 tests for us. They're not really automatic, they were used to test robustness more than to test the logic correctness. 

