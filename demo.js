var MiniAssetsBuilder = require('./MiniAssetsBuilder');
var fs = require('fs');
var assetsFolder = 'assets';
var saveFilename = 'myAssets';

var m = new MiniAssetsBuilder();
var buf = m.build(assetsFolder);
if(buf){
fs.writeFileSync(saveFilename, buf);
console.log('ok');
}