'user strict';

cs142App.controller('UserRegisterController', ['$scope', '$resource',
    function ($scope, $resource) {	        
		
		$scope.first_name = "" ;
		$scope.last_name = "" ;
		$scope.location = "" ;
		$scope.description = "" ;
		$scope.occupation = "" ;
		$scope.login_name = "" ;
		$scope.password = "" ;
		$scope.passwordRe = "" ;
		
		$scope.registerMe = function() {
			if (!$scope.first_name
				|| !$scope.last_name
				|| !$scope.location
				|| !$scope.description
				|| !$scope.occupation
				|| !$scope.login_name
				|| !$scope.password
				|| !$scope.passwordRe) {
				
				$scope.errorMsg = "Register fields are incomplete. All fields are required." ;
			}
			
			if ($scope.password !== $scope.passwordRe) {
				$scope.errorMsg = "Passwords do not match." ;
			}
			
			let d = $resource("http://localhost:3000/user")
					.save({first_name: $scope.first_name, last_name: $scope.last_name,
							location: $scope.location, description: $scope.description,
							occupation: $scope.occupation, login_name: $scope.login_name,
							password: $scope.password},
						function() {
							$scope.successMsg = "Registration successful" ;
							$scope.first_name = "" ;
							$scope.last_name = "" ;
							$scope.location = "" ;
							$scope.description = "" ;
							$scope.occupation = "" ;
							$scope.login_name = "" ;
							$scope.password = "" ;
							$scope.passwordRe = "" ;
						}, function(json) {
							$scope.errorMsg = "Registration failed. " + json.data ;
						}) ;
		} ;
		
    }]);