<?php
// любимка php, круто когда кода почти нет, а работает, а в nodejs версии кода больше, смещение и тд...
class MiniAssetsBuilder{

private $magicBytes;
private $countFiles;

public function __construct(){
$this->magicBytes = array(1, 2, 3);
$this->countFiles = 0;
}

private function scanDir($path, $pathStart = ''){
$buf = '';
if(is_dir($path)){
$files = scandir($path);
for($i = 2; $i < count($files); $i++){
$filename = $files[$i];
$path2 = $path.'/'.$filename;
$fullName = $pathStart.'/'.$filename;
if(is_dir($path2)){
$buf .= $this->scanDir($path2, $fullName);
}else{
++$this->countFiles;
$file = file_get_contents($path2);
$buf .= pack('v', strlen($fullName));
$buf .= $fullName;
$buf .= pack('V', strlen($file));
$buf .= $file;
}
}
}
return $buf;
}

public function build($path){
$buf = '';
for($i = 0; $i < count($this->magicBytes); $i++){
$buf .= pack('C', $this->magicBytes[$i]);
}
$buf2 = $this->scanDir($path);
$buf .= pack('V', $this->countFiles);
$buf .= $buf2;
return $buf;
}

}
?>