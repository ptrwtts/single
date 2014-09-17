angular.module('single.controllers', [])

.controller('MainCtrl', function($scope, $rootScope, $location) {

	$scope.init = function() {

		if(!localStorage['apikey'] || localStorage['apikey']=="null") {
		    $rootScope.logout();
		} else {
		    $rootScope.apikey = localStorage['apikey'];
		}

	}

	$rootScope.logout = function() {
		localStorage.removeItem('apikey');
		$location.path('/welcome');
	}

	$scope.init();

})

.controller('WelcomeCtrl', function($scope, $rootScope, $location) {

	var authWindow = false;
	
	$scope.twitterLogin = function () {
		// Show feed if already logged in
		if(localStorage['apikey']) {
			$scope.login();
			return true;
		}
		// Otherwise, load Auth
	  	var authUrl = 'http://singlevsnoise.com/api/twitter/auth.php';
	    var width = 600,  height = 550, left = (screen.width / 2) - (width / 2),  top = (screen.height / 2) - (height / 2);
  		authWindow = window.open(authUrl, 'twitter', 'menubar=no,location=no,resizable=no,scrollbars=no,status=no, width=' + width + ', height=' + height + ', top=' + top + ', left=' + left);
  		if(ionic.Platform.isWebView()){
	  		authWindow.addEventListener('loadstart', function(event) { 
	  			console.log(event);
			  	if(event.url.indexOf('success.php')>0) {
			  		data = event.url.split('?');
			  		console.log(data)
			  		var vars = event.url.split('?')[1].split("&");
					for (var i=0;i<vars.length;i++) {
						var pair = vars[i].split("=");
					    console.log(pair[0]+': '+pair[1]);
						window.localStorage.setItem(pair[0],pair[1]);
					}
					$scope.login();
		  		}
	  		});
	  	} else {
			/* Slightly different handling for web browsers */
			$scope.receiveMessage = function(event){
			    if (event.origin !== "http://singlevsnoise.com") { return; }
			    if (authWindow) {
			    	localStorage['apikey'] = event.data;
					$scope.login(true);			
			    }
			}
			window.addEventListener("message", $scope.receiveMessage, false);
	  	}
	}

	/* After auth, show feed */

	$scope.login = function(apply) {
		$rootScope.apikey = localStorage['apikey'];     
        if(authWindow) { authWindow.close(); }
		$location.path('/');
		if(apply) { $scope.$apply(); }
	}

})

.controller('FeedCtrl', function($scope, $rootScope, $http, $sce) {

	$scope.init = function() {
		$scope.feed = [];
		$scope.items = [];
		$scope.users = {};
		$scope.infinite = true; // Allow infinite scroll to kick in and load initial tweets
	}

	$scope.getItems = function(refresh) {

		var method = "statuses/home_timeline";
		var options = {count:200};
		if($scope.items.length) {
			if(refresh) {
				options['since_id'] = $scope.items[0].id_str;
			} else {
				options['max_id'] = decreaseStringIdByOne($scope.items[$scope.items.length-1].id_str);
			}
		} else {
			options['count'] = 20; // Only fetch 20 the first time around
		}
		var url = buildUrl(method,options);
		console.log(url);

	  	$http({method: 'GET', url: url}).
		    success(function(data, status, headers, config) {
		    	console.log(data);
		    	if(data.length>0) {
			    	$scope.items = refresh ? data.concat($scope.items) : $scope.items.concat(data); // append or prepend
			    	angular.forEach($scope.items, function(item) {
			    		if(!item.html) { item = prepareItem(item); }  // embed links
			    		item.time = relativeTime(item.created_at);			 // calcualte relative time
			    	});
			    } else {
			    	$scope.infinite = false;
			    }
       			$scope.$broadcast('scroll.refreshComplete');
			    $scope.$broadcast('scroll.infiniteScrollComplete');
		    }).
		    error(function(data, status, headers, config) {
		    	
		    });

	}

	$scope.handleLink = function(e,href) {
		href = href ? href : e.target.href;
		target = ionic.Platform.isAndroid() ? '_system' : '_blank';
		if(ionic.Platform.isIOS() && href.indexOf('twitter.com')>-1) {
			var piece = href.split('/');
			if(href.indexOf('/status/')>-1) { href = 'twitter://status?id='+piece[5]; } else
			if(href.indexOf('/search?')>-1) { href = 'twitter://'+piece[3]; } else
			{ href = 'twitter://user?screen_name='+piece[3]; }		
			target = '_system';	
		}
		console.log(href);
		window.open(href, target);
		e.preventDefault();
		e.stopPropagation();
	}


	function buildUrl(method,options) {		
	  	var url = "http://singlevsnoise.com/api/twitter/get.php?method="+method+"&apikey="+$rootScope.apikey;
	  	angular.forEach(options, function(value, key) { url += '&options['+key+']='+value;  });
  	    return url;
	}	

	// Workaround for Javascript not supporting 64 bit numbers (Tweet IDs)
	function decreaseStringIdByOne(n) {
	    n = n.toString();
	    var result=n;
	    var i=n.length-1;
	    while (i>-1) {
	      if (n[i]==="0") {
	        result=result.substring(0,i)+"9"+result.substring(i+1);
	        i --;
	      }
	      else {
	        result=result.substring(0,i)+(parseInt(n[i],10)-1).toString()+result.substring(i+1);
	        return result;
	      }
	    }
	    return result;
	}

	function prepareItem(item) {
		item = linkify_entities(item);
		item.user.profile_image_url = item.user.profile_image_url.replace('_normal','_bigger');
		return item;
	}	
	 
	function linkify_entities(tweet) {

		/* adapted from https://gist.github.com/wadey/442463 */

		// Use original tweet if retweeted
		if(tweet.retweeted_status) {
			tweet.entities = tweet.retweeted_status.entities;
			tweet.text = tweet.retweeted_status.text;
		}

	    if (tweet.entities) {
	    
		    var index_map = {};
		    
		    angular.forEach(tweet.entities.urls, function(entry,i) {
		        index_map[entry.indices[0]] = [
		        	entry.indices[1], 																												// [0] = end of entity
		        	"<a target='_blank' ng-click='handleLink($event)' href='"+escapeHTML(entry.url)+"'>"+escapeHTML(entry.display_url)+"</a>",		// [1] = html
		        	entry.display_url, 																												// [2] = display
		        	entry.url 																														// [3] = text to be replaced
		        ]
		    })
		    
		    angular.forEach(tweet.entities.hashtags, function(entry,i) {
		        index_map[entry.indices[0]] = [
		        	entry.indices[1], 
		        	"<a target='_blank' ng-click='handleLink($event)' href='http://twitter.com/search?q="+escape("#"+entry.text)+"'>#"+escapeHTML(entry.text)+"</a>",
		        	"#"+entry.text,
		        	"#"+entry.text
		        ]
		    })
		    
		    angular.forEach(tweet.entities.user_mentions, function(entry,i) {
		        index_map[entry.indices[0]] = [
		        	entry.indices[1], 
		        	"<a target='_blank' ng-click='handleLink($event)' title='"+escapeHTML(entry.name)+"' href='http://twitter.com/"+escapeHTML(entry.screen_name)+"'>@"+escapeHTML(entry.screen_name)+"</a>",
		        	"@"+entry.screen_name,
		        	"@"+entry.screen_name
		        ]
		    })
		 
		    angular.forEach(tweet.entities.media || [], function(entry,i) {
		        index_map[entry.indices[0]] = [
		        	entry.indices[1], 
		        	"<a target='_blank' ng-click='handleLink($event)' href='"+escapeHTML(entry.expanded_url)+"'>"+escapeHTML(entry.display_url)+"</a>",
		        	entry.display_url,
		        	entry.url
		        ];
		    });
		    
		    tweet.html = "";
		    tweet.display = "";
		    
		    // iterate through the string looking for matches in the index_map
		    for (i=0; i < tweet.text.length; ++i) {
		        var ind = index_map[i];
		        if (ind) {

		        	// handle when emojis (or something else) breaks the index
		        	var correction = 0;
		        	while(tweet.text.charAt(i)!=ind[3].charAt(0)) {  
		        		i++; correction++;
		        		if(correction>140) { i = i-correction; correction = 0; break; } // failsafe
		        	}
		            if(correction>0) { tweet.html += " "; }

		            // append content
		            tweet.html += ind[1];
		            tweet.display += ind[2];

		            // increment counter
		            i = ind[0] + correction - 1;

		        } else {
		        	tweet.html += tweet.text.charAt(i);
		        	tweet.display += tweet.text.charAt(i);
		        }
		    }	 

		}

	    if(tweet.retweeted_status) {
			tweet.text = "RT @"+tweet.retweeted_status.user.screen_name+": "+tweet.text;
			tweet.display = "RT @"+tweet.retweeted_status.user.screen_name+": "+tweet.plain;
			tweet.html = "RT <a target='_blank' ng-click='handleLink($event)' href='http://twitter.com/"+tweet.retweeted_status.user.screen_name+"'>@"+tweet.retweeted_status.user.screen_name+"</a>: "+tweet.html;
	    }
	    
	    return tweet;
	}

	function escapeHTML(text) {
	    text = text.replace(/&amp;/g,'\u0026');
        text = text.replace(/&gt;/g,'\u003E');
        text = text.replace(/&lt;/g,'\u003C');
        text = text.replace(/&(quot;|apos;)/g,'\u0022');
        text = text.replace(/&#039;+/g,'\u0027');
        return text;
	}

	function relativeTime(time) {
	    var t = new Date(time);
	    var now = new Date();
	    var ago = (now.getTime()-t.getTime())/60000;  // minutes since post
	    if(ago<60*24) {                                 // less than a day old
	        if(ago<1) {                                 // less than a minute old
	            var timestamp = Math.floor(ago*60)+"s";
	        } else if(ago<60) {                             // less than an hour old
	            var timestamp = Math.floor(ago)+"m";
	        } else {
	            var timestamp = Math.floor(ago/60)+"h";
	        }
	    } else {        
	        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	        var timestamp = t.getDate()+" "+months[t.getMonth()];
	    }
	    return timestamp;
	}

	/*  Hack for calculating size before rendering

	$scope.canvas = document.createElement('canvas');
    $scope.ctx = $scope.canvas.getContext('2d');
	$scope.itemHeight = function(item) {
		var minheight = 70;
		var charsperline = 35;
		var lineheight = 20;
		var linewidth = window.outerWidth - 150;
		//var height = (minheight - 2*lineheight) + (Math.ceil(item.text.length/charsperline)*lineheight);
		var height = (minheight - 2*lineheight) + (Math.ceil($scope.ctx.measureText(item.text).width/linewidth) * lineheight);
		return height>minheight ? height : minheight;
	}

	*/

	$scope.init();
	
})

.controller('SettingsCtrl', function($scope) {
	
})

.controller('UserCtrl', function($scope) {
	
})

.controller('ItemCtrl', function($scope) {
	
})