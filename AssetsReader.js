class AssetsReader{

constructor(){
this.magicBytes = [1, 2, 3]; // магические байты для определения, должны совпадать с теми которые были указаны в упаковщике ресурсов
this.files = [];
this.buf = null;
this.startPos = this.magicBytes.length;
}

// проверка, это точно файл с ресурсами?
isValid(){
if(this.buf && this.buf.length > this.magicBytes.length){
for (var i = 0; i < this.magicBytes.length; i++) {
if(this.buf[i] != this.magicBytes[i])return false;
}
return true;
}
return false;
}

// поиск файла
findFile(path){
for (var i = 0; i < this.files.length; i++) {
var info = this.files[i];
if(info.path == path)return info;
}
return null;
}

// поиск файлов по расширению, например если нужно найти все png файлы, передать функции png, результат это массив с файлами
findFilesExt(ext){
var arr = [];
for (var i = 0; i < this.files.length; i++) {
var info = this.files[i];
if(info.ext == ext)arr.push(info);
}
return arr;
}

readString(buf){
var d = new TextDecoder();
return d.decode(buf);
}

// этот способ поможет избежать перерасхода памяти когда читается какой то файл, создаётся внутри ссылка на главный буфер, но уже со смещением, главное правильно передать все параметры чтобы всё работало!
readBytes(pos, size){
return new Uint8Array(this.buf.buffer, pos, size); 
}

// нельзя просто так взять и получить Uint8Array из файла который выбрали, или который перенесли в окно... А вот так можно!
readFile(file, callback){
var th = this;
var reader = new FileReader();
reader.onload = (e) => {
th.read(new Uint8Array(e.target.result), callback);
};
reader.onerror = () => {
th.read(null, callback);
};
reader.readAsArrayBuffer(file);
}

// создание ссылки из файла, тогда сможем работать даже с Image обычным способом передав в src специальный url, Blob магия она такая :)
createURL(file, contentType){
if(!contentType)contentType = 'application/octet-stream';
if(file){
var bytes = this.readBytes(file.pos, file.size);
var blob = new Blob([bytes], {type:contentType});
var url = URL.createObjectURL(blob);
return url;
}
return null;
}

// важная функция которая читает файл, ей надо передать Uint8Array (например загрузка по сети) если же файл просто перенесли в окно, тогда эта функция уже будет вызвана из функции readFile
// для удобства эта функция возвращает boolean, чтобы лишнюю анонимную функцию не передавать если данные грузятся через сеть
read(buf, callback){
this.buf = buf;

if(buf && this.isValid()){
var view = new DataView(buf.buffer); // это как Buffer в nodejs, но с другими методами
var pos = this.startPos;
var count = view.getUint32(pos, true);
pos += 4; // двигаемся дальше на 4 байта после получения количества файлов

// читаем по той же логике как и записывали файл с ресурсами
// последовательность важна, пришлось больше кода оставить, в одну строчку читать такое сложно
if(count > 0){
for (var i = 0; i < count; i++) {

var filenameLength = view.getUint16(pos, true);
pos += 2;

var filenameBuffer = this.readBytes(pos, filenameLength);
var filePath = this.readString(filenameBuffer);

var fileName = filePath.split('/').pop(); // получаем только имя файла (без папок)
var fileExt = fileName.split('.').pop(); // получаем расширение файла

pos += filenameLength;

var fileSize = view.getUint32(pos, true);
pos += 4;

this.files.push({path:filePath, name:fileName, ext:fileExt, pos:pos, size:fileSize}); // теперь мы знаем о файле всё что нужно для чтения отдельно!
pos += fileSize;
}
}

if(callback)callback(true);
return true;
}else{
if(callback)callback(false);
}
return false;
}

}