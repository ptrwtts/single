<?php echo 'Logged in! Returning you to the app...'; ?>
<!DOCTYPE html>
<html>
	<head>
      	<title>Single</title>
		<script>
			var target = window.self === window.top ? window.opener : window.parent;
			console.log(target);
			var apikey = '<?=$_GET[apikey]?>';
			if (apikey) { 
		  		localStorage['apikey'] = apikey;
				if(target) {
			    	target.postMessage(apikey, '*'); 
			    	console.log(apikey);
			    }
			}
		</script>	
</head>
   	<body>
		Logged in! Returning you to the app...
   	</body>
</html>