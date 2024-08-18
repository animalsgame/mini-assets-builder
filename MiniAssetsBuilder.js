var fs = require('fs');

class MiniAssetsBuilder{

constructor(){
this.magicBytes = [1, 2, 3]; // магические байты по которым идёт определение "точно это файл с ресурсами?" можно указать любое число от 0 до 255 (включительно)
this.files = [];
this.bufferSize = 4 + this.magicBytes.length; // 4 байта (int) для количества файлов + размер magicBytes.
}

// сканирование всех файлов в папке, если в папке есть ещё файлы и папки - тоже найдёт!
scanDir(path, pathStart){
if(!pathStart)pathStart = '';
var files = fs.readdirSync(path);
if(files){
for (var i = 0; i < files.length; i++) {
var filename = files[i];
var path2 = path+'/'+filename;
var fullName = pathStart+'/'+filename;
var stat = fs.lstatSync(path2);
if(stat.isDirectory()){
this.scanDir(path2, fullName);
}else{
var filenameBuffer = Buffer.from(fullName);
var filesize = stat.size;
var calcSize = filenameBuffer.length + filesize + 2 + 4; // берём размер (имя файла) в байтах + 2 байта для размера имени файла (short) + 4 байта для размера всего файла (int).
this.bufferSize += calcSize;
this.files.push({name:fullName, path:path2, filenameBuffer:filenameBuffer});
}
}
}
}

// функция упаковывает ресурсы и возвращает Buffer, либо null.
build(path){
try{ // перехватываем ошибки, вдруг например такого пути с ресурсами нет вообще.

this.scanDir(path);

// начинается магия :)
var count=this.files.length;

if(this.bufferSize > 0){
// создаём буфер один раз, нам уже известен общий размер благодаря функции scanDir!
var buf = Buffer.alloc(this.bufferSize);
var pos = 0;

for (var i = 0; i < this.magicBytes.length; i++){ // записываем магические байты.
buf.writeUInt8(this.magicBytes[i], pos);
++pos;
}

// записываем количество файлов.
buf.writeUInt32LE(count, pos);
pos += 4; // int занимает 4 байта, двигаемся вперёд.

for (var i = 0; i < count; i++) {
var info = this.files[i];

var fileBuffer = fs.readFileSync(info.path);

var filenameLength = info.filenameBuffer.length;
var fileSize = fileBuffer.length;

// записываем размер строки (имя файла)
buf.writeUInt16LE(filenameLength, pos);
pos += 2; // двигаемся дальше на 2 байта.

info.filenameBuffer.copy(buf, pos); // теперь копируем имя файла уже в байтах
pos += filenameLength; // прибавляем размер строки (имя файла)

// записываем размер файла
buf.writeUInt32LE(fileSize, pos);
pos += 4; // двигаемся дальше на 4 байта.

fileBuffer.copy(buf, pos); // теперь копируем сам файл без всяких циклов!
pos += fileSize; // прибавляем размер файла, иначе смещение будет неправильное! А всё должно быть точно, иначе файл не запишется полностью (или другие чудеса).
}
return buf;
}
}catch(e){
console.error(e);
}

return null;
}

}

module.exports = MiniAssetsBuilder;