<?php

function nice($string) { return mysql_real_escape_string(($string)); }

function show($string) { echo '<pre>'; print_r($string); echo '</pre>'; }

function wrap($n) { return("'".nice($n)."'"); }

function dbConnect() {
	$con=mysql_connect(MYSQL_HOST,MYSQL_USER,MYSQL_PASSWORD) or die("connection failed");
	mysql_select_db(MYSQL_DB,$con);
	mysql_query("SET NAMES 'utf8'");
}

function sqlPrepare($item) {
    foreach($item as $key => $value) { 
    	$keynames[] = $key; 
    	$duplicates[] = $key." = VALUES(".$key.")";
    	$updates[] = $key." = ".wrap($value);
    }
    $data['keys'] = implode(',',$keynames);
    $data['duplicates'] = implode(',',$duplicates);
    $data['updates'] = implode(',',$updates);
    $data['values'] = implode(',',array_map("wrap",$item));
    return $data;
}

function randomString($length) {
  $chars = "0123456789qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";
  $random = '';
  for ($i = 0; $i < $length; $i++) {
    $random .= $chars[mt_rand(0, strlen($chars)-1)];
  }
  return $random;
}

function apiKey() {
	$key = randomString(24);
	// Make sure it doesn't already exist
	$sql = "SELECT * 
			FROM user 
			WHERE apikey = '".nice($key)."'";
	$results = mysql_query($sql);
	$row = mysql_fetch_assoc($results);
	if($row) {
		return apiKey();
	} else {
		return $key;
	}
}

function getUser($value,$lookup='twitter_username') {
	$sql = "SELECT * FROM user WHERE $lookup = '$value'";
	if($results = mysql_query($sql)) {
		$user = mysql_fetch_assoc($results);
	} else {
		echo mysql_error().'<br><br>'.$sql;
	}
	return $user;
}

function saveUser($details) {
	$user = getUser($details["twitter_username"]);
	if(!$user) { $details['apikey'] = apiKey(); }
	$data = sqlPrepare($details);
	if($user) {
		$sql = "UPDATE user SET ".$data['updates']." WHERE id = ".$user['id'];
	} else {
		$sql = "INSERT INTO user(".$data['keys'].")  VALUES (".$data['values'].") ON DUPLICATE KEY UPDATE ".$data['duplicates'];
	}
	if(mysql_query($sql)) {
		$user = getUser($details["twitter_username"]);
	} else {
		echo mysql_error().'<br><br>'.$sql;
	}
	return $user;
}

?>