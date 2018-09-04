"use strict";

cs142App.controller('LoginRegisterController', ['$scope', '$resource', '$sessionStorage', '$location', '$window',
	function($scope, $resource, $sessionStorage, $location, $window) {
		$scope.login_name = "" ;
		$scope.password = "" ;
		$scope.errorMsg = null ;
		
		$scope.login = function() {
			let u = $resource("http://localhost:3000/admin/login")
					.save({login_name: $scope.login_name, password: $scope.password},
					function() {
						$sessionStorage.loggedUser = u ;
						$location.path("/users/" + u._id) ;
						$window.location.reload() ;
					}, function() {
						$scope.errorMsg = "Login error, try again." ;
					}) ;
		} ;
		
		$scope.register = function() {
			$location.path("/user-register") ;
		} ;
		
	}]) ;