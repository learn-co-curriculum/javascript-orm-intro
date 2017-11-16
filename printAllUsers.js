const User = require('./User.js');

(async function(){
  const users = await User.All()
  users.forEach(function(user){
    console.log(`${user.name} is ${user.age} with id ${user.id}`)  
  })
})();