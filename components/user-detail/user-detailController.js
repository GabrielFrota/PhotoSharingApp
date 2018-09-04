'use strict';

cs142App.controller('UserDetailController', ['$scope', '$routeParams', '$resource',
  function ($scope, $routeParams, $resource) {	
    /*
     * Since the route is specified as '/users/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */
    var userId = $routeParams.userId;
    
    let u = $resource("http://localhost:3000/user/" + userId).get(function() {     	
    	$scope.u = u ;
    	$scope.main.userName = u.first_name + " " + u.last_name ;
    	$scope.u.name = $scope.main.userName ; 	
    }, function() { 	
    	console.log("error at http://localhost:3000/user/" + userId + "request") ;  	
    }) ;
    
    let newP = $resource("http://localhost:3000/lastUploadedPhoto/" + userId)
    			.get(function() {
    				$scope.lastUploadedPhoto = newP ;
    			}, function() {
    				console.log("error at http://localhost:3000/lastUploadedPhoto/" + userId + "request") ;
    			}) ;
    
    let comP = $resource("http://localhost:3000/mostCommentedPhoto/" + userId)
    			.get(function() {
    				$scope.mostCommentedPhoto = comP ;
    			}, function() {
    				console.log("error at http://localhost:3000/mostCommentedPhoto/" + userId + "request") ;
    			}) ;
    
  }]);
