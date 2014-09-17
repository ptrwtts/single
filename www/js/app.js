angular.module('single', [
  'ionic', 
  'single.controllers', 
  'single.directives', 
  'single.filters', 
  'single.services', 
  'angular-data.DSCacheFactory'
])

.run(function($ionicPlatform, $http, DSCacheFactory) {

  // Setup Ionic
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });

  // Cache
  DSCacheFactory('defaultCache', {
      maxAge: 900000,               // Items added to this cache expire after 15 minutes.
      cacheFlushInterval: 6000000,  // This cache will clear itself every hour.
      deleteOnExpire: 'aggressive', // Items will be deleted from this cache right when they expire.
      storageMode: 'localStorage'   // This cache will sync itself with `localStorage`.
  });
  $http.defaults.cache = DSCacheFactory.get('defaultCache');

})

.config(function($stateProvider,$urlRouterProvider) {
  $stateProvider

  .state('welcome', {
    url: '/welcome',
    templateUrl: 'templates/welcome.html',
    controller: 'WelcomeCtrl'
  })

  .state('feed', {
    url: '/',
    templateUrl: 'templates/feed.html',
    controller: 'FeedCtrl'
  })

  .state('settings', {
    url: '/settings',
    templateUrl: 'templates/settings.html',
    controller: 'SettingsCtrl'
  })

  .state('user', {
    url: '/user/:id',
    templateUrl: 'templates/user.html',
    controller: 'UserCtrl'
  })

  .state('item', {
    url: '/item/:id',
    templateUrl: 'templates/item.html',
    controller: 'ItemCtrl'
  })

  $urlRouterProvider.otherwise('/');
  
})