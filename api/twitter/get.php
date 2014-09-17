<?php

header('Content-type: application/json');

/* Proxy for Twitter API calls, because their API doesn't support pure JS access */

session_start();
require_once('twitteroauth/twitteroauth.php');
require_once('../config.php');
require_once('../methods.php');

dbConnect();

$user = getUser($_GET['apikey'],'apikey');
$options = $_GET['options'] ? $_GET['options'] : array();

/* If access tokens are missing. */
if (empty($user['twitter_token']) || empty($user['twitter_secret'])) {
	$response = array('error'=>'Missing credentials');
	echo json_encode($response); exit;
}

/* If not method provided */
if(!$_GET['method']) {
	$response = array('error'=>'No method');
	echo json_encode($response); exit;
}

/* Create a TwitterOauth object with consumer/user tokens. */
$connection = new TwitterOAuth(CONSUMER_KEY, CONSUMER_SECRET, $user['twitter_token'], $user['twitter_secret']);

/* Fetch from Twitter */
$response = $connection->get($_GET['method'], $options);

echo json_encode($response);

?>
