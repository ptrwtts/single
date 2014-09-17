angular.module('single.filters', [])

.filter('unique', function($parse) {

	/* adapted from https://github.com/a8m/angular-filter */
	
	return function (collection, property) {

      //collection = (isObject(collection)) ? toArray(collection) : collection;

      if (!angular.isArray(collection)) {
        return collection;
      }

      //store all unique identifiers
      var uniqueItems = [],
          get = $parse(property);

      return (angular.isUndefined(property)) ?
        //if it's kind of primitive array
        collection.filter(function (elm, pos, self) {
          return self.indexOf(elm) === pos;
        }) :
        //else compare with equals
        collection.filter(function (elm) {
          var prop = get(elm);
          if(some(uniqueItems, prop)) {
            return false;
          }
          uniqueItems.push(prop);
          return true;
      });

      //checked if the unique identifier is already exist
      function some(array, member) {
        if(angular.isUndefined(member)) {
          return false;
        }
        return array.some(function(el) {
          return angular.equals(el, member);
        });
      }

    }

});