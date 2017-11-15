const User = require('./User.js');

(async function(){
  console.log("Running migration for User")
  await User.CreateTable()
  console.log("Migration Done.")

  const adele = new User("Adele Goldberg", 62)
  const alan = new User("Alan Kay", 65)  

  await adele.insert()
  await alan.insert()  
})();