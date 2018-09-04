'use strict';

var cs142App = angular.module('cs142App', ['ngRoute', 'ngMaterial', 'ngResource', 'ngStorage']) ;

cs142App.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.
            when('/users', {
                templateUrl: 'components/user-list/user-listTemplate.html',
                controller: 'UserListController'
            }).
            when('/users/:userId', {
                templateUrl: 'components/user-detail/user-detailTemplate.html',
                controller: 'UserDetailController'
            }).
            when('/photos/:userId', {
                templateUrl: 'components/user-photos/user-photosTemplate.html',
                controller: 'UserPhotosController'
            }).
            when('/login-register', {
            	templateUrl: 'components/login-register/login-registerTemplate.html',
            	controller: 'LoginRegisterController'
            }).
            when('/user-register', {
            	templateUrl: 'components/user-register/user-registerTemplate.html',
            	controller: 'UserRegisterController'
            }).
            when('/activities', {
            	templateUrl: 'components/activities/activitiesTemplate.html',
            	controller: 'ActivitiesController'
            }).
            otherwise({
                redirectTo: '/users'
            });
    }]);

cs142App.controller('MainController', ['$scope', '$rootScope', '$sessionStorage', 
										'$location', '$resource', '$window', '$http',
    function ($scope, $rootScope, $sessionStorage, $location, $resource, $window, $http) {
        $scope.main = {} ;
        $scope.main.title = 'Users' ;
        $scope.main.baseUrl = "http://localhost:3000/photo-share.html#!" ;
        
        if (!$sessionStorage.loggedUser) {
        	$scope.main.userMsg = "Please login" ;
        	$scope.main.logoutButton = false ;
        	$scope.main.activitiesButton = false ;
        } else {
        	$scope.main.userMsg = "Hi " + $sessionStorage.loggedUser.first_name ;
        	$scope.main.logoutButton = true ;
        	$scope.main.activitiesButton = true ;
        }
                
        $scope.main.logoutButtonOnClick = function() {
        	let d = $resource("http://localhost:3000/admin/logout").save(function() {
        		delete $sessionStorage.loggedUser ;
        		$location.path("/login-register") ;
        		$window.location.reload() ;
        	}, function() {
        		console.log("Error on POST request to http://localhost:3000/admin/logout") ;
        	}) ;
        } ;
        
        $rootScope.$on("$routeChangeStart", function(event, next, current) {
            if (!$sessionStorage.loggedUser) {
                if (next.templateUrl !== "components/login-register/login-registerTemplate.html"
                	&& next.templateUrl !== "components/user-register/user-registerTemplate.html") {
                    $location.path("/login-register") ;
                }
            }
            else {
            	if (next.templateUrl === "components/login-register/login-registerTemplate.html"
                	|| next.templateUrl === "components/user-register/user-registerTemplate.html") {
            		$location.path("users/" + $sessionStorage.loggedUser._id) ;
            	}
            }
        });
        
        let selectedPhotoFile ;
        
        $scope.inputFileNameChanged = function (element) {
            selectedPhotoFile = element.files[0] ;
        };
        
        $scope.inputFileNameSelected = function () {
            return !!selectedPhotoFile ;
        };
        
        $scope.uploadPhoto = function () {
            if (!$scope.inputFileNameSelected()) {
                console.error("uploadPhoto called will no selected file") ;
                return ;
            }
            console.log('fileSubmitted', selectedPhotoFile) ;

            var domForm = new FormData() ;
            domForm.append('uploadedphoto', selectedPhotoFile) ;

            $http.post('/photos/new', domForm, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            }).then(function successCallback(response){
                // The photo was successfully uploaded. XXX - Do whatever you want on success.
            }, function errorCallback(response){
                // Couldn't upload the photo. XXX  - Do whatever you want on failure.
                console.error('ERROR uploading photo', response) ;
            });
        };
        
    }]);

