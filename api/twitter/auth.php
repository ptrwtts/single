<?php

/* Authenticate users and save access token for future calls */

session_start();
require_once('twitteroauth/twitteroauth.php');
require_once('../config.php');
require_once('../methods.php');

if(!$_REQUEST['oauth_token'])  {    /* 1. Generate a Request Token */	
	
	/* Build TwitterOAuth object with client credentials. */
	$connection = new TwitterOAuth(CONSUMER_KEY, CONSUMER_SECRET);
	 
	/* Get temporary credentials. */
	$request_token = $connection->getRequestToken(OAUTH_CALLBACK);

	/* Save temporary credentials to session. */
	$_SESSION['request_token'] = $request_token;

	switch ($connection->http_code) {
	  case 200:
	    /* Build authorize URL and redirect user to Twitter. */
	    $url = $connection->getAuthorizeURL($request_token['oauth_token']);
	    header('Location: ' . $url); 
	    break;
	  default:
	    /* Show notification if something went wrong. */
	    echo 'Could not connect to Twitter. Refresh the page or try again later.';
	    exit;
	}

} else {   /* 2. Fetch and save Access Token */	

	/* Create TwitteroAuth object with app key/secret and token key/secret from default phase */
	$connection = new TwitterOAuth(CONSUMER_KEY, CONSUMER_SECRET, $_SESSION['request_token']['oauth_token'], $_SESSION['request_token']['oauth_token_secret']);

	/* Request access tokens from twitter */
	$access_token = $connection->getAccessToken($_REQUEST['oauth_verifier']);
	show($access_token);

	/* Save the access tokens. Normally these would be saved in a database for future use. */
	$_SESSION['access_token'] = $access_token;

	$twitter = $connection->get('account/verify_credentials');

	$user = array(
		"twitter_username"=>$twitter->screen_name,
		"twitter_token"=>$access_token['oauth_token'],
		"twitter_secret"=>$access_token['oauth_token_secret']
	);
	dbConnect();
	$user = saveUser($user);

}

/* 3. Store credentials in Local Storage to pass back to the app */

?>
