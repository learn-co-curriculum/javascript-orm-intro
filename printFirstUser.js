const User = require('./User.js');

(async function(){
  const user = await User.Find(1)
  console.log(`${user.name} is ${user.age} with id ${user.id}`)
})();