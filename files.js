const fs = require('fs');
const file = './assets/cats';
fs.readdir(file, (err, files) => {
    if (err) return console.log(err);
    fs.writeFile(`${file}.json`, JSON.stringify(files), err => {
        if (err) return console.log(err);
    })
})
