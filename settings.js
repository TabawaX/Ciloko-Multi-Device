const fs = require('fs');

function settings() {
  return {
    "devname": "Yoanobi dv", 
    "pairingNumber": "6289515948455",
    "developer": "6283834281572",
    "sprefix": "!", 
    "pairing": true,
    "welcome": true,
    "adminevent": false,
    "groupevent": false
  };
}

module.exports = { settings };

let file = require.resolve(__filename);

fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update'${__filename}'`));
  delete require.cache[file];
  require(file);
});