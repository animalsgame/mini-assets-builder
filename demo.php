<?php
require('./MiniAssetsBuilder.php');
$assetsFolder = 'assets';
$saveFilename = 'myAssets';

$m = new MiniAssetsBuilder();
$buf = $m->build($assetsFolder);
if($buf){
file_put_contents($saveFilename, $buf);
echo 'ok';
}
?>