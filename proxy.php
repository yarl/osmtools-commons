<?php
    //hack from http://stackoverflow.com/a/12683591/1418878

    if (!isset($_GET['url'])) die();
    $url = urldecode($_GET['url']);
    $url = 'http://' . str_replace('http://', '', $url);
	
    //echo file_get_contents($url);
    
    $ch = curl_init(); 
    $timeout = 0; 
    curl_setopt ($ch, CURLOPT_URL, $url); 
    curl_setopt ($ch, CURLOPT_RETURNTRANSFER, 1); 
    curl_setopt ($ch, CURLOPT_CONNECTTIMEOUT, $timeout); 
    $file_contents = curl_exec($ch); 
    curl_close($ch); 
    echo $file_contents;  
?>
