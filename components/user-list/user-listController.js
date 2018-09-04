'use strict';

cs142App.controller('UserListController', ['$scope', '$resource', '$sessionStorage',
    function ($scope, $resource, $sessionStorage) {		
        	
		$scope.main.title = 'Users' ;
        
		$scope.ACTIVITY_PHOTO_UPLOAD = 1 ;
		$scope.ACTIVITY_COMMENT_ADDED = 2 ;
		$scope.ACTIVITY_USER_REGISTER = 3 ;
		$scope.ACTIVITY_USER_LOG_IN = 4 ;
		$scope.ACTIVITY_USER_LOG_OUT = 5 ;
		
        if ($sessionStorage.loggedUser) {
            let res = $resource("http://localhost:3000/user/list").query(function() { 
            	
            	function compUser(u) {
            		return u._id === $sessionStorage.loggedUser._id ;
            	}
            	
            	let i = res.indexOf(res.find(compUser)) ;
            	
            	$scope.loggedUser = res.splice(i, 1)[0] ; ;
            	$scope.userList = res ;     
            }) ;
        } 
    }]);

