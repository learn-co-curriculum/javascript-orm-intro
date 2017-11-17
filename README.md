# Object Relational Mapping in Node with SQLite3

## Objectives

1. Explain the concept of an ORM and why we build them.
2. Describe the code that will map your Javascript objects to a database.
3. Understand the SQLite3 NPM API

## What is an ORM?

Object Relational Mapping (ORM) is the technique of accessing a relational database using an object-oriented programming language. Object Relational Mapping is a way for our Javascript programs to manage database data by "mapping" database tables to classes and instances of classes to rows in those tables.

The basic premise is that if you have a class `User`, you should have a table called `users` in your database. Instances of the `User` class in your program should map to rows in the `users` table in the database. Properties of an instance of a `User` in your program should map to the columns in the `users` table. 

![Code and DB](https://cl.ly/nh9W/Image%202017-11-14%20at%201.47.44%20PM.png)

In general an ORM is designed to provide access to the basic CRUD functionality of CREATE, RETRIEVE, UPDATE, and DELETE.

The `User` object can even handle a lot of the database integration, knowing how to create the required tables and schema, insert records based on instances, update the row corresponding to an instance, delete the row corresponding to an instance, and find rows and return instances.

There is no special programming magic to an ORM, it is just a pattern in which we implement the code that connects our JS program to our database and maps a class to a table.

There are a number of reasons why we use the ORM pattern. Two good ones are:

* Cutting down on repetitious code.
* Implementing conventional patterns that are organized and sensical.

The most important thing is the encapsulation of Database logic and SQL into an object. It is a trust between an object and the programmer, when you say `user.save()` you know it has been saved, whether it was an `INSERT` or an `UPDATE` or the specific database implementation, Mongo or SQL, none of it matters. The object fully encapsulates the persistance and database, and you just trust it. You hide the details and simplify the rest of your program. Once an ORM is designed, how it works no longer matters to the rest of the application. That's what makes building complex and large database-backed applications powerful.

## A Sample ORM in Javascript

**To play with these examples, you have to `git clone git@github.com:learn-co-curriculum/javascript-orm-intro.git` into the Learn IDE or your environment. Then, `cd javascript-orm-intro` to work in the project folder.**

To build an ORM in JavaScript powered by SQL and a Relational Database we need a Database Driver object that can open a connection to a database and execute SQL and return raw data in the form of Arrays, Strings, and Integers, to our code. For SQLite, we are going to use the [SQLite npm package](http://www.sqlitetutorial.net/sqlite-nodejs/).

```js
// Load npm module specificed in package.json
const sqlite3 = require('sqlite3').verbose();

// open the database
const db = new sqlite3.Database(`./db/development.sqlite`, sqlite3.OPEN_READWRITE);

// export the DB to rest of application.
module.exports = db;
```

In that example, `db` is now an object that represents a connection to the database. The string you pass to the constructor function of `sqlite3.Database` is the path to the database file. The `sqlite3` instance responds to 3 important functions:

### `db.run()`

To execute statements where there is no return value from the database, such as `CREATE TABLE`, `INSERT`, `UPDATE`, and `DELETE`, we use the `db.run()` function. The general syntax for that function is `db.run(sql, [replacements], callback)`. 

#### `User.CreateTable()`

Let's look at an example of how we might create a `users` table for a `User` class.

**Included in File: [User.js](https://github.com/learn-co-curriculum/javascript-orm-intro/blob/master/User.js#L5-L22)**
```js
const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database(`./db/development.sqlite`, sqlite3.OPEN_READWRITE)

class User {
  static CreateTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        name TEXT,
        age INTEGER
      )
    `
    
    console.log("Preparing to create the users table...")

    return new Promise(function(resolve){
      db.run(sql, function(){
        console.log("...users table created!")
        resolve("Success")        
      })
    })
  }
}
```

We've implemented a `static` class function `User.CreateTable()` that has the SQL for creating a `users` table. Since communicating with the database is always considered an operation that will need to be made synchronous, we wrap every execution of `db.run()` within a promise, making sure to `resolve` the promise in the callback of the successfully executed SQL statement. Without using a promise, the rest of our program would not be able to rely on the table existing before trying to write into it with insert.

Always wrap any call to the database in a promise and resolve the promise in the callback of the db call when you know the statement was executed successfully. 

You could execute `User.CreateTable()` synchronously with:

**Included in File: [insertUsers.js](https://github.com/learn-co-curriculum/javascript-orm-intro/blob/master/insertUsers.js#L5)**
```js
(async function(){
  await User.CreateTable();
})()
```

#### `.insert()` 

Let's see how we would use `db.run()` to `INSERT` an instance of a `User` into the `users` table.

**Included in File: [User.js](https://github.com/learn-co-curriculum/javascript-orm-intro/blob/master/User.js#L60-L78)**
```js
const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database(`./db/development.sqlite`, sqlite3.OPEN_READWRITE)

class User {
  constructor(name, age){
    this.name = name
    this.age = age
  }

  insert() {
    const self = this

    const sql = `INSERT INTO users (name, age) VALUES (?, ?)`
    console.log(`Inserting user ${self.name} into database...`)

    return new Promise(function(resolve){
      db.run(sql, [self.name, self.age], function(){
        console.log(`...user ${this.lastID} inserted into database`)
        self.id = this.lastID
        resolve(self)
      })
    })
  }
}
```

The `insert()` example is a little more complex. 

First, we have to cast `this`, which inside `insert()` is set to the current instance of the user, to a new variable, `self`. We do this so that as the definition of `this` changes inside the upcoming promise and callback, we can still refer to the current instance of the user.

In our insert SQL statement, we are using `?` to replace the actual values we want to appear in that statement. The statement, for a user named "Gabe" of age 33 should read: `INSERT INTO users (name, age) VALUES ("Gabe", 33)` but instead of building that string through interpolation directly, ``INSERT INTO users (name, age) VALUES (${this.name}, ${this.age})`` we reserve places for the values with `?` marks. Why? [SQL](https://en.wikipedia.org/wiki/SQL_injection) [Injection](https://www.w3schools.com/sql/sql_injection.asp) and [Little Bobby Drop Tables](https://xkcd.com/327/). 

When we call `db.run` we will provide the values to use in place of those `?` but they will be sanitized and made safe: `db.run(sql, arrayOfValues, callback)`

After wrapping our `db.run` in a promise, the important step is to remember to `resolve` your promise with the return value of the SQL execution. After inserting an instance of a user into the database, to maintain database integrity, it's important to update the instance of the user with the primary key of the corresponding row that was just inserted into the database.

After a `db.run` execution of an `INSERT` statement, the SQLite3 database driver makes the last inserted primary key available to the callback provided to the `db.run` function. 

```js
db.run(sql, [self.name, self.age], function(){
  console.log(`...user ${this.lastID} inserted into database`)
  self.id = this.lastID
  resolve(self)
})
```

Within that callback function, `db.run` makes the scope of `this` to be information about the insert containing the property `lastID`. We can update the instance of user, which we early cast to the variable `self`, to have the `id` property of `this.lastID`, which the `db` driver provided.

With that, we have a fully functioning `insert()` instance method for our `User` ORM. 

```
[00:04:20] javascript-orm-intro
// ♥ node
> const User = require('./User.js')
undefined
> const avi = new User("Avi", 33)
undefined
> avi.id
undefined
> avi.insert()
Inserting user Avi into database...
Promise {
  <pending>,
  domain: 
   Domain {
     domain: null,
     _events: { error: [Function: debugDomainError] },
     _eventsCount: 1,
     _maxListeners: undefined,
     members: [] } }
> ...user 9 inserted into database
avi.id
9
```

### `db.get()`

We use the `db.run()` function when we want to execute SQL but don't really care about or expect a result set from the query. That's perfect for `INSERT, UPDATE, DELETE` and `CREATE TABLE`, but less so for `SELECT`, where we explictly want a row from the database returned. That's where `db.get()` comes in.

`db.get()` is meant to return only the first result row from a `SELECT` query. This makes `db.get()` ideal for `SELECT` queries with a `WHERE` clause and a `LIMIT 1`, ensuring the DB returns the first desired row. The symmetrical operation of such a `SELECT`, for example, `SELECT * FROM users WHERE id = 1 LIMIT 1;`, looking for the user with the primary key `id` matching `1` with a `LIMIT 1` clause ensuring a single row return value, is `User.Find(id)`, a static class function on `User` that queries for a single user based on primary key. The implementation, along with the promise ensuring synchronous behavior, is:

**Included in File: [User.js](https://github.com/learn-co-curriculum/javascript-orm-intro/blob/master/User.js#L24-L39)**
```js
class User{
  static Find(id){
    const sql = `SELECT * FROM users WHERE id = ? LIMIT 1`

    console.log(`Querying for user id ${id}...`)

    return new Promise(function(resolve){
      db.get(sql, [id], function(err, resultRow){
        console.log(`...found ${JSON.stringify(resultRow)}!`)

        const user = new User(resultRow.name, resultRow.age)
        user.id = resultRow.id

        resolve(user)        
      })
    })  
  }
}
```

Notice that the call to `db.get` is again wrapped within the callback of a promise. All database executions to `db` should be nested within the callback of a promise. Embedding the database operation within the callback of a promise enables you to always `await` the resolution using `resolve`, forcing the promise into a synchronous execution.

The important thing to focus on in this implemetation is the callback provided to `db.get()`. The signature of the function call is: `db.get(sql, [replacements], function(err, resultRow){})`. The callback provided as the final argument to `db.get()` will accept 2 arguments, the first any error object, the second, the singular resulting row of the query as a JSON object, in the case of a row from the `users` table, `{id: 1, name: Adele Goldberg}`.

```js
db.get(sql, [id], function(err, resultRow){
  console.log(`...found ${JSON.stringify(resultRow)}!`)

  const user = new User(resultRow.name, resultRow.age)
  user.id = resultRow.id

  resolve(user)        
})
```

In this callback, we take the second argument, a raw JSON object of the user's row, and we use the data to create a real `User` instance in the context of our program. This process is known as reification, taking raw data and turning it into an instance of an ORM class. We use the `User` constructor for `name` and `age` of `resultRow` and then set the `id` property of the instance of a `User` to the `id` of `resultRow`.

This is an important step. When we take data out of the database, it's important to convert it into the domain object in our program, an actual instance of a `User`. If we don't reify the raw data into a `User` instance, none of the other functionality available to a `User` will work.

The final step in the callback is to `resolve` the enclosing promise by passing the reified instance of the `User` based on the `resultRow`.

The file `printFirstUser.js` has an implementation that makes use of `async` and `await` to search for the user with primary key `1` and print the user instance's details:

**File: [printFirstUser.js](https://github.com/learn-co-curriculum/javascript-orm-intro/blob/master/printFirstUser.js)**
```js
const User = require('./User.js');

(async function(){
  const user = await User.Find(1)
  console.log(`${user.name} is ${user.age} with id ${user.id}`)
})();
```

Running that script produces:

```
// ♥ node printFirstUser.js 
Querying for user id 1...
...found {"id":1,"name":"Adele Goldberg","age":62}!
Adele Goldberg is 62 with id 1
```

### `db.all()`

The last crucial function exposed by the `SQLite3` database driver is `db.all()`. Unlike `db.get()`, this function is built to return all rows that match a query. It's syntax and structure is exactly like `db.get()`, but the 2nd argument passed to the callback will be an array.

We could use `db.all()` to implement a `static` class function on `User` of `All()`, to return all users from our database. By this point, you should start recognizing the pattern.

**Included in File: [User.js](https://github.com/learn-co-curriculum/javascript-orm-intro/blob/master/User.js#L41-L58)**
```js
  static All(){
    const sql = `SELECT * FROM users`

    console.log(`Loading all users...`)
    return new Promise(function(resolve){
      db.all(sql, function(err, results){
        console.log(`...found ${results.length} users!`)

        const users = results.map(function(userRow){
          const user = new User(userRow.name, userRow.age)
          user.id = userRow.id
          return user
        })

        resolve(users)
      })
    })      
  }
```  

The differences between `All()` and `Find(id)` aren't too many. The `SELECT ` statement is not scoped to query for a particular user, but rather to return all the rows. The callback for `db.all()` accepts an array of result rows. The most complicated and significant difference is how we map or collect all the raw row data into actual `User` instances. `results.map` will yield each row individually to the callback provided. We take each `userRow` and cast the raw data into a `User` instance and return it, making the entire return value of `results.map` a new array filled with actual `User` instances based on the results from the DB. That collection becomes the `resolve` of the promise that wraps the `db.all()` call.

We can see this in action by running `printAllUsers.js`

**File: printAllUsers.js**
```js
const User = require('./User.js');

(async function(){
  const users = await User.All()
  users.forEach(function(user){
    console.log(`${user.name} is ${user.age} with id ${user.id}`)  
  })
})();
```

Which will output (depending on how many users you have in your DB):

```
// ♥ node printAllUsers.js 
Loading all users...
...found 2 users!
Adele Goldberg is 62 with id 1
Alan Kay is 65 with id 2
```

And with that we have implemented the majority of the ORM functionality we have been looking for - congratulations!
