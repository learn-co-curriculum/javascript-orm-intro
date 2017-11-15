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
  
  static Find(id){
    const sql = `SELECT * FROM users WHERE id = ?`

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

module.exports = User