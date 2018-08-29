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
Disclaimer: If you're testing my code from my database and you get weird outputs for certain usernames, passwords, because the database hasn't changed since the early days, before the program worked fine. Don't be scared of null outputs for certain usernames, or a unhashed password for those users.
## Customizing the code

This is amateurish code, but if you want to use it as a base for something better, the first step is customizing the /models/index.js.

What you want to change is :

```js
sequelize = new Sequelize("postgres://popmmtnk:k4p7M5zyk6VhgC_pr8PimC1PFQ4l_nxp@horton.elephantsql.com:5432/popmmtnk",opts)
```
And set up your own database. I'll let you figure that out on your own using Sequelize's docs. The rest is up to reading the docs, reading comments and if things get really rough, opening an issue. 

Both models are pretty self explanatory because they're not using anything but the basics. Hooks will be explained in the ##REST Endpoints part

## Parsing output

Expected inputs in the API endpoints and their responses are described down below. Status 500 errors are not described. Generally, if you experience a status error with 500, you can't do much about it. The issue is with the server. Look for explanations in the response JSONs as you go. 
## REST endpoints:

### POST /signup

Sign up to the system(username and password). 
#### Request:
POST:
- username: username
- password: password

##### Request rules

- Username and password must be longer than 4, shorter than 32"
    - response:

 400

    ```json
    {err:'Invalid input',status: 'Password or username is too short(must be longer than 4 characters, shorter than 32)'}
    ```

- Username must not already exist in the entry or general error with the database
    - response:

400

    ```json
     {err: 'Invalid input',status: 'Username already exists!'}
    ```

Invalid input errors take priority over errors with existing usernames, because the server internally checks the input before querying the database.

##### Successful output
In case you have successfuly signed up the user, it generates the following response:

200

```json
{status:'success',result:createdUser}
```

createdUser being the user object, which contains the user's id, username and likedByCount(should always be 0!).
### POST /login

Log in an existing user with a password

#### POST request body:

- username: username
- password: password

##### Request rules

- User credentials must be correct
    - 400 
    ```json
    {err: "Authentication error",status: "Credentials don't exist!"'}
    ```

##### Successful output

In case you have successfuly signed in the user, it generates the following response:

200 
```json
{status:'Success',token:jwt}
```

## Authorizing with JWT

In case you don't add a token in the headers in x-www-form-urlencoded
`token:YOURTOKENHERE`

You received your token during login.

In case it's false:

403

```json
{err: "Wrong token",
status: "Unverifiable token"}

```
In case you added no token:

403
```json
{
err: "No token",
status: "Missing or unverifiable token!"
}
```


### GET /me

Get the currently logged in user information. This call needs to be authenticated.

#### Request headers

- token : jwt

JWT: JSON Web Token you received when logging in. Token times out after **7 days**

This mostly only fails due to lack of correct JWT. 

### Successful response
Example of a succesful response

200 
```json
    "succ": "Success",
    "id": 34,
    "username": "david",
    "likedByCount": 0
}
```

### POST /me/update-password

Change the logged in user's password.

### PUT Request body

- password : password

#### Request rules

- Password is too short(under 4 or too long)

400
```json
{
    "err": "Invalid input",
    "status": "Password or username is too short/long(must be longer than 4 characters, shorter than 32)"
}
#### Successful response

Example of a successful call:

http://127.0.0.1:1337/api/me/update-password

Response:

200

``` json

{
    "status": "Success",
    "result": 1
}


```



### GET /user/:id/

:id could be a user's username or a users id.

Lists the usernames and number of likes of a user. This is not an authenticated call, which is why the body can be empty.

Example of a request:

http://127.0.0.1:1337/api/10

or

http://127.0.0.1:1337/api/david14


#### Request rules

Token rules apply.

- User doesn't exist:

400

```json 
{err: "User doesnt exist",
status: "The username or id you've requested does not exist"}
```

#### Successful response

Example of a successful response

200


``` json
{
    "status": "success",
    "id": "4"
    "username": "david14",
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

400

```json
{
    "err": "Liking yourself error",
    "status": "You cant like yourself",
}
```

- You can only like a existing user 

400

```json
{

    "err": "User doesnt exist",
    "status": "The username or id you've requested does not exist"

}

```

- You can't like a user you've already liked

400

```json
{
    "err": "Already liked",
    "status": "You've already liked this user!"
}
```

#### Successful response

http://127.0.0.1:1337/api/user/1/like would trigger a response:

200

```json
{
    "status": "Success",
    "liked":1
}
```
"liked": always returns the id of the liked user. 

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

400
```json
{
err: "Cant like yourself",
status: "A user can only like other users, not himself"
}
```
- You can only unlike an existing user 
400
```json
{
    "err": "User doesnt exist",
    "status": "The username or id you've requested does not exist"
}
```
- You can't unlike a user you've already liked

400
```json
{
    "err": "Already unliked",
    "status": "You already don't like this user"
}
```
#### Successful response
200
```json
{
    "succ": "Success",
    "unliked": 5
}
```

### GET /most-liked

List users in a most to least liked manner. 

Is not an authenticated call. This could always be tested first, because of this. If this call doesn't return a "200 OK" response, most likely nothing is going to work. 

Example:

http://127.0.0.1:1337/api/most-liked

#### Successful response

```json
Is not an authenticated call. This could always be tested first, because of this. If this call doesn't return a "200 OK" response, most likely nothing is going to work. 
```json
{
    "status": "Success",
    "leaderBoard": [
        {
            "id": 6,
            "username": "express",
            "likedByCount": 6
        },
        {
            "id": 4,
            "username": "neovim",
            "likedByCount": 2
        },
        {
            "id": 5,
            "username": "test",
            "likedByCount": 2
        },
        {
            "id": 8,
            "username": "express12",
            "likedByCount": 1
        },
        {
            "id": 1,
            "username": "neovim12",
            "likedByCount": 1
        },
        {
            "id": 24,
            "username": "aafy2t1",
            "likedByCount": 0
        },
        {
            "id": 25,
            "username": "xddada",
            "likedByCount": 0
        },
        {
            "id": 26,
            "username": "aliexpress",
            "likedByCount": 0
        },
        {
            "id": 3,
            "username": "neovim121",
            "likedByCount": 0
        },
        {
            "id": 36,
            "username": "david1",
            "likedByCount": 0
        },
        {
            "id": 37,
            "username": "david13",
            "likedByCount": 0
        },
        {
            "id": 34,
            "username": "david",
            "likedByCount": 0
        },
        {
            "id": 30,
            "username": null,
            "likedByCount": 0
        },
        {
            "id": 7,
            "username": "express1",
            "likedByCount": 0
        },
        {
            "id": 18,
            "username": "xio51",
            "likedByCount": 0
        },
        {
            "id": 22,
            "username": "test111",
            "likedByCount": 0
        },
        {
            "id": 23,
            "username": "aafy2",
            "likedByCount": 0
        }
    ]
}
```
## Tests

Postman takes care of 47 tests for us. They're not really automatic, they were used to test robustness more than to test the logic correctness. 

I will try to implement supertest in the upcoming days.

