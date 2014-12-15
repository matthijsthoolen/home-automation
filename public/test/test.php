<?php

$token = "JCSXJO6dn5sKyGD9sAVU8zZPS8mUDatA";

function getAccountInfo() {
	$ch = curl_init();
	$url =  "https://api.pushbullet.com/v2/users/me";
	
	curl_setopt($ch, CURLOPT_URL, $url);
	
	$output = curl_exec($ch);
	
	curl_close($ch);
	
	return $output;
}

?>