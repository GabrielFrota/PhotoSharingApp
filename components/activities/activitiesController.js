"use strict";

cs142App.controller('ActivitiesController', ['$scope', '$resource', '$sessionStorage', '$location', '$window',
	function($scope, $resource, $sessionStorage, $location, $window) {
	
    $scope.ACTIVITY_PHOTO_UPLOAD = 1;
    $scope.ACTIVITY_COMMENT_ADDED = 2;
    $scope.ACTIVITY_USER_REGISTER = 3;
    $scope.ACTIVITY_USER_LOG_IN = 4;
    $scope.ACTIVITY_USER_LOG_OUT = 5;
	
    const acts = $resource("http://localhost:3000/latestActivities").query(() => {
      $scope.acts = acts ;
      console.log(acts) ;
    }) ;
}]) ;