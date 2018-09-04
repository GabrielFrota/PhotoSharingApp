'use strict';

cs142App.controller('UserPhotosController', ['$scope', '$routeParams', '$resource', '$sessionStorage',
  function($scope, $routeParams, $resource, $sessionStorage) {
    /*
     * Since the route is specified as '/photos/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */
    let userId = $routeParams.userId;
    
    let u = $resource("http://localhost:3000/user/" + userId).get(function() {
    	$scope.main.userName = u.first_name + " " + u.last_name ;
    }) ;
        
    const photos = $resource("http://localhost:3000/photosOfUser/" + userId).query(() => {
      for (let elem of photos) {
    		for (let like of elem.likes) {
    			if (like.user_id === $sessionStorage.loggedUser._id) {
    				elem.liked = true ;
    				break ;
    			}
    		}
    	}
    	$scope.photos = photos ;
    });
    
    $scope.newComments = [] ;
    
    $scope.onClickSendComment = function(pid) {
    	let d = $resource("http://localhost:3000/commentsOfPhoto/" + pid)
    			.save({comment: $scope.newComments[pid]}, 
    					function(){
    						let compFun = function(p) {
    							return p._id === pid ;					
    						} ;
    						let c = {comment: $scope.newComments[pid],
    								 date_time: new Date(),
    								 user: $sessionStorage.loggedUser} ;
    						$scope.photos.find(compFun).comments.push(c) ;
    					}, function() {
    						console.log("ERROR") ;
    					}) ;
    } ;
    
    $scope.like = function(pid) {
    	let d = $resource("http://localhost:3000/likePhoto/" + pid)
    			.save(function() {
    				$scope.photos.find(p => p._id === pid).likes.push(d) ;
    				$scope.photos.find(p => p._id === pid).liked = true ;
    			}, function() {
    				console.log("Error on likePhoto call") ;
    				console.log(d) ;
    			});
    } ;
    
    $scope.unlike = function(pid) {
    	let d = $resource("http://localhost:3000/unlikePhoto/" + pid)
				.save(function() {
					let likes = $scope.photos.find(p => p._id === pid).likes ;
					likes.splice(likes.indexOf(likes.find(
							l=> l.user_id === $sessionStorage.loggedUser._id)), 1) ;
					$scope.photos.find(p => p._id === pid).liked = false ;
				}, function() {
					console.log("Error on unlikePhoto call") ;
					console.log(d) ;
				});
    } ;
    
  }]);
