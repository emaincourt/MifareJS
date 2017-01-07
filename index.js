const spawn     = require('child_process').spawn,
      execFile  = require('child_process').execFile,
      fs        = require('fs'),
      console   = require('better-console'),
      colors    = require('colors/safe');

var re        = /(.{2}  .{2}  .{2}  .{2})/,
    error     = { 'type' : 0, 'message' : '' };

// Read Mifare Classic 1K UID
// Returns new promise :
//  - resolve(uid)
//  - reject({error.type,error.message})
function readMifareUID() {

  return new Promise(function(resolve,reject){

    execFile('nfc-list', (err, stdout, stderr) => {

      error.message = stderr || "";
      error.message = err  || "";

      error.type = 0;

      if(err || stderr)
        reject(error);
      else
        resolve(extractUIDFromOutput(stdout));

    });

  });

}

// Prints Hex Data File to terminal
// Input : path to the file, cb Callback function to execute after reading file
// Output : null
function readHexFile(path,cb){
  fs.readFile(path, function(err, code){

    var buffer  = [[]],
        index   = 0;

    code.forEach(function(el){

      buffer[index].push(el.toString(16));

      if(buffer[index].length == 16){
        buffer.push([]);
        index++;
      }
    });

    console.table(buffer);

    if(cb && typeof cb === 'function')
      cb(buffer);

  });
}

// Reads Mifare Classic 1K tag and writes dump to path
// Input : Path to the file
// Output : Promise that will be resolved after reading created file
function readMifareClassic(path){
  return new Promise(function(resolve,reject){
    writeMifareDumpToFile(path,resolve,reject).then(function(path){
      readHexFile(path);
      resolve();
    },function(err){
      reject(err);
    });
  });
}

// Write Mifare Dumb to file
// Input : Path to the file
// Output : Promise that will be resolved when file is written
function writeMifareDumpToFile(path){
  return new Promise(function(resolve,reject){

    console.log(colors.blue('Please wait while trying to authenticate to the tag...'));

    execFile('mfoc', ['-O' + path].concat(keys), (err, stdout, stderr) => {

      error.message = stderr || "";
      error.message = err  || "";

      error.type = 1;

      if(err || stderr)
        reject(error);
      else
        resolve(path);

    });
  });
}

function cloneMifareClassic(source,target,unlock,callback){

  var params = (unlock) ? ' W X ' : ' w x ';
      params += target + ' ' + source;

  execFile('nfc-mfclassic' + params, [], (err, stdout, stderr) => {

    error.message = stderr || "";
    error.message = err  || "";

    error.type = 2;

    if(err || stderr)
      console.log(error.message);
    else
      console.log(colors.green('Successfully cloned.'));

  })
}

function extractUIDFromOutput(output){
  return (output.match(re)) ? output.match(re)[1].replace(/ /g,'') : 0;
}

module.exports = {
  readMifareUID: readMifareUID,
  readMifareClassic: readMifareClassic,
  readHexFile : readHexFile,
  writeMifareDumpToFile: writeMifareDumpToFile
};
