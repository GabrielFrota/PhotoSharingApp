"use strict";

/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the database.
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */

var mongoose = require('mongoose');
var async = require('async');

// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');
var Activity = require('./schema/activity.js') ;
var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');
var processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');
var fs = require("fs");

var express = require('express');
var app = express();

// XXX - Your submission should work without this line
var cs142models = require('./modelData/photoApp.js').cs142models;

mongoose.connect('mongodb://localhost/cs142project6');

// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));
app.use(session({secret: 'secretKey', resave: false, saveUninitialized: false}));
app.use(bodyParser.json());

app.get('/', function (request, response) {
    response.send('Simple web server of files from ' + __dirname);
});

/* 
  This was already here. It is an example on how to use some available functionalities

 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get('/test/:p1', function (request, response) {
    // Express parses the ":p1" from the URL and returns it in the request.params objects.
    console.log('/test called with param1 = ', request.params.p1);

    var param = request.params.p1 || 'info';

    if (param === 'info') {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
        SchemaInfo.find({}, function (err, info) {
            if (err) {
                // Query returned an error.  We pass it back to the browser with an Internal Service
                // Error (500) error code.
                console.error('Doing /user/info error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {
                // Query didn't return an error but didn't find the SchemaInfo object - This
                // is also an internal error return.
                response.status(500).send('Missing SchemaInfo');
                return;
            }

            // We got the object - return it in JSON format.
            console.log('SchemaInfo', info[0]);
            response.end(JSON.stringify(info[0]));
        });
    } else if (param === 'counts') {
        // In order to return the counts of all the collections we need to do an async
        // call to each collections. That is tricky to do so we use the async package
        // do the work.  We put the collections into array and use async.each to
        // do each .count() query.
        var collections = [
            {name: 'user', collection: User},
            {name: 'photo', collection: Photo},
            {name: 'schemaInfo', collection: SchemaInfo}
        ];
        async.each(collections, function (col, done_callback) {
            col.collection.count({}, function (err, count) {
                col.count = count ;
                done_callback(err) ;
            });
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var obj = {};
                for (var i = 0; i < collections.length; i++) {
                    obj[collections[i].name] = collections[i].count;
                }
                response.end(JSON.stringify(obj));
            }
        });
    } else {
        // If we know understand the parameter we return a (Bad Parameter) (400) status.
        response.status(400).send('Bad param ' + param);
    }
});

/*
  Some common operations used by a lot of request handlers
*/

const checkLoggedUser = (req, res) => {
  if (!req.session.loggedUser) {
    res.sendStatus(400);
    return false;
  }
  else {
    return true;
  }
}

const checkValidId = (req, res) => {
  const id = req.params.id;
  if (!id) {   
    res.sendStatus(400);
    return false;
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.sendStatus(400);
    return false;
  }
  return true;
}

/*
  This is called at the start of many functions. It checks
  if there is a logged user in the session, and it checks
  if the :id url parameter is a valid mongoose ID.
*/
const handlerPrologue = (req, res) => {
  if (!checkLoggedUser(req, res)) {
    return false;
  }
  if (!checkValidId(req, res)) {
    return false;
  }
  return true;
}

/*
  This is called in many functions when an error
  occurs. Logs the error in the server console, and 
  sends a 500 status code response with the error.
*/
const sendError = (errorMessage, err, res) => {
  console.log(errorMessage);
  console.log(err);
  res.status(500).send(err);
}

const ACTIVITY_PHOTO_UPLOAD = 1;
const ACTIVITY_COMMENT_ADDED = 2;
const ACTIVITY_USER_REGISTER = 3;
const ACTIVITY_USER_LOG_IN = 4;
const ACTIVITY_USER_LOG_OUT = 5;

/*
  Returns the 20 most recent activities
*/
app.get('/latestActivities', async (req, res) => {
  if (!checkLoggedUser(req, res)) {
    return;
  } 
  try {
    const acts = await Activity.find({}, {}).lean()
      .sort({date_time: 'desc'}).limit(20);
    
    res.end(JSON.stringify(acts));
  }
  catch (e) {
    sendError('Error at /latestActivities/:id', e, res);
  }
});

/*
  Tries to login with user credentials sent in the request body.
  Password hashing functionality added as a before save hook in
  the userSchema
*/
app.post('/admin/login', async (req, res) => {
  try {
    const user = await User.findOne({
      login_name: req.body.login_name, 
    });

    if (!user || !user.comparePasswords(req.body.password)) {
      res.sendStatus(401);
      return;
    }
    
    const act = {
      activity_type: ACTIVITY_USER_LOG_IN, 
      date_time: Date.now(),
      user_name: user.first_name + " " + user.last_name
    };
    const savedAct = await Activity.create(act);

    user.last_activity = savedAct;
    const savedUser = await User.findByIdAndUpdate(user._id, user).lean();
    delete savedUser.password;
    delete savedUser.__v;
    req.session.loggedUser = savedUser;
    res.end(JSON.stringify(savedUser));
  }
  catch (e) {
    sendError('Error at /admin/login', e, res);
  }
});

/*
  Logs out the current user in the req.session object
*/
app.post('/admin/logout', async (req, res) => {
  if (!checkLoggedUser(req, res)) {
    return;
  }
  
  const act = {
    activity_type: ACTIVITY_USER_LOG_OUT, 
    date_time: Date.now(),
    user_name: req.session.loggedUser.first_name
      + ' ' + req.session.loggedUser.last_name
  };

  try {
    const savedAct = await Activity.create(act);
    const user = await User.findById(req.session.loggedUser._id);
    user.last_activity = savedAct;
    const savedUser = await user.save();
    delete req.session.loggedUser;
    res.end();
  } 
  catch (e) {
    sendError('Error at /admin/logout', e, res);
  }
});

/*
 * URL /user/list - Return all the User object.
 */
app.get('/user/list', async (req, res) => {
  if (!checkLoggedUser(req, res)) {
    return;
  }

  try {
    const users = await User.find({}, {
      __v: 0,
      description: 0,   
      login_name: 0, 
      password: 0
    })
      .populate('last_activity').lean(); 

    res.end(JSON.stringify(users));
  } 
  catch (e) {
    sendError('Error at /user/list', e, res);
  }
});

/*
 * URL /user/:id - Return the information for User (id)
 */
app.get('/user/:id', async (req, res) => {
  if (!handlerPrologue(req, res)) {
    return;
  }
  const id = req.params.id;

  try {
    const user = await User.findById(id, {
      __v: 0, 
      login_name: 0, 
      password: 0
    }).lean();

    res.end(JSON.stringify(user));
  }
  catch (e) {
    sendError('Error at /user/:id', e, res);
  }
});

/*
  This function is a little tricky to understand, as it has to build
  the data from a few different models. It searches in parallel, for all 
  the user info of all the comments of all the photos in the photosOfUser array, 
  blocking on the Promise arrays with Promise.all() before returning.
*/
app.get('/photosOfUser/:id', async (req, res) => {
  if (!handlerPrologue(req, res)) {
    return;
  }
  const id = req.params.id;

  try {
    const photos = await Photo.find({user_id: id}, {__v: 0}).lean();
    if (!photos || photos.length === 0) {
      res.end();
      return;
    }

    const photosWithUserInfo = await Promise.all(photos
      .map(async (p) => { 
        if (p.comments.length === 0) {
          return p;
        }
        const commentsWithUserInfo = await Promise.all(p.comments
          .map(async (c) => {
            const filters = {
              location: 0, 
              description: 0, 
              occupation: 0,
              __v: 0,
              password: 0, 
              login_name: 0
            };       
            try {
              const user = await User.findById({_id: c.user_id}, filters).lean();
              c.user = user;
              delete c.user_id;
              return c;
            }
            catch (e) {
              /*
                if an error occurs while querying the user, we return the comment 
                object without adding the extra user info. Returning an error here
                would stop the Promise.all() and break the whole page. It did not look 
                like the right approach to break the whole page if a single comment
                goes wrong.
              */      
              return c;
            }
          }));
        p.comments = commentsWithUserInfo;
        return p;
      }));
    /*
      sort photos array with added user info and return it
    */
    const photoComparator = (a, b) => {
      if (a.likes.length > b.likes.length)
        return -1;
      if (a.likes.length < b.likes.length)
        return 1;
      if (a.date_time.valueOf() > b.date_time.valueOf())
        return -1;
      if (a.date_time.valueOf() < b.date_time.valueOf())
        return 1;

      return 0;
    }
    photosWithUserInfo.sort(photoComparator);
    res.end(JSON.stringify(photosWithUserInfo));
  }
  catch (e) {
    sendError('Error at /photosOfUser/:id', e, res);
  }
});

/*
  Returns most recent uploaded photo from user with _id = :id
*/
app.get('/lastUploadedPhoto/:id', async (req, res) => {
  if (!handlerPrologue(req, res)) {
    return;
  }
  const id = req.params.id;

  try {
    const photos = await Photo.find({user_id: id}).lean();
    if (!photos || photos.length === 0) {
      res.end();
      return;
    }
    const newestPhoto = photos.reduce((acc, val) => (
      val.date_time.valueOf() > acc.date_time.valueOf()
        ? val
        : acc 
    ), photos[0]);

    res.end(JSON.stringify(newestPhoto));
  }
  catch (e) {
    sendError('Error at /lastUploadedPhoto/:id', e, res);
  }
});

/*
  Returns most commented photo from user with _id = :id
*/
app.get('/mostCommentedPhoto/:id', async (req, res) => {
  if (!handlerPrologue(req, res)) {
    return;
  }
  const id = req.params.id;

  try {
    const photos = await Photo.find({user_id: id}).lean();

    if (!photos || photos.length === 0) {
      res.end();
      return;
    }
    const mostCommentedPhoto = photos.reduce((acc, val) => (
      val.comments.length > acc.comments.length
        ? val
        : acc
    ), photos[0]);

    res.end(JSON.stringify(mostCommentedPhoto));
  } 
  catch (e) {
    sendError('Error at /mostCommentedPhoto/:id', e, res);
  }
});

/*
  Returns photo with _id = :id
*/
app.get('photo/:id', async (req, res) => {
  if (!handlerPrologue(req, res)) {
    return;
  }
  const id = req.params.id;

  try {
    const photo = Photos.findOne({_id: id}).lean();
    res.end(JSON.stringify(photo));
  } 
  catch (e) {
    sendError('Error at /photo/:id', e, res);
  }
});

/*
  Register a new user with the data from the POST request body
*/
app.post('/user', async (req, res) => {

  if (!req.body.first_name
      || !req.body.last_name
      || !req.body.location
      || !req.body.description
      || !req.body.occupation
      || !req.body.login_name
      || !req.body.password) {
    
    res.status(400).send('Missing field(s) for the user registration');
    return;
  }

  try {
    const user = await User.findOne({login_name: req.body.login_name}).lean();
    if (user) {
      res.status(400).send('Login name already in use');
      return;
    }

    const newUser = {
      first_name: req.body.first_name, 
      last_name: req.body.last_name,
      location: req.body.location, 
      description: req.body.description,
      occupation: req.body.occupation, 
      login_name: req.body.login_name,
      password: req.body.password
    };
    const savedUser = await User.create(newUser);

    const act = {
      activity_type: ACTIVITY_USER_REGISTER, 
      date_time: Date.now(),
      user_name: savedUser.first_name + " " + savedUser.last_name
    };
    const savedAct = await Activity.create(act);

    savedUser.last_activity = savedAct;
    const savedUser2 = await savedUser.save();
    res.end();
  } 
  catch (e) {
    sendError('Error at /user', e, res);
  }
});

/*
  Adds new comment sent in the POST body to photo with _id = :id.
  This url looks a little weird for me, but it was in the project specification
  to write it like this. It had some tests that expected it like this.
*/
app.post('/commentsOfPhoto/:id', async (req, res) => {
  if (!handlerPrologue(req, res)) {
    return;
  }
  const id = req.params.id;

  try {
    const photo = await Photo.findById(id);
    if (!photo) {
      res.status(400).send('Invalid photo id in the URL');
      return
    }
    const newComment = {
      comment: req.body.comment,
      date_time: Date.now(),
      user_id: req.session.loggedUser._id
    };
    photo.comments.push(newComment);
    const savedPhoto = await Photo.findByIdAndUpdate(photo._id, photo);

    const act = {
      activity_type: ACTIVITY_COMMENT_ADDED, 
      date_time: Date.now(),
      photo_file_name: photo.file_name,
      comment_text: newComment.comment,
      user_name: req.session.loggedUser.first_name
        + ' ' + req.session.loggedUser.last_name
    };
    const savedAct = await Activity.create(act);

    const filters = {
      location: 0, 
      description: 0, 
      occupation: 0,
      __v: 0,
      password: 0, 
      login_name: 0
    }; 
    const user = await User.findById(req.session.loggedUser._id, filters);
    user.last_activity = savedAct;
    const savedUser = await user.save();

    delete newComment.user_id;
    newComment.user = savedUser;
    res.end(JSON.stringify(newComment));
  } 
  catch (e) {
    sendError('Error at /commentsOfPhoto/:id', e, res);
  }
});

/*
  Adds a like from session.loggedUser to photo with _id = :id
*/
app.post('/likePhoto/:id', async (req, res) => {
  if (!handlerPrologue(req, res)) {
    return;
  }
  const id = req.params.id;

  try {
    const photo = await Photo.findById(id);

    if (photo.likes
        .some(l => l.user_id == req.session.loggedUser._id)) {
      // this user alredy liked this photo. This is an error.
      res.sendStatus(400);
      return;
    }
    const newLike = { 
      user_id: req.session.loggedUser._id, 
      date_time: Date.now() 
    };

    photo.likes.push(newLike);
    const savedPhoto = await Photo.findByIdAndUpdate(photo._id, photo);
    res.end(JSON.stringify(newLike));
  } 
  catch (e) {
    sendError('Error at /likePhoto/:id', e, res);
  }
});

/*
  Removes like from session.loggedUser from photo with _id = :id
*/
app.post("/unlikePhoto/:id", async (req, res) => {
  if (!handlerPrologue(req, res)) {
    return;
  }
  const id = req.params.id;

  try {
    const photo = await Photo.findById(id);
    
    const indexForRemoval = photo.likes.indexOf(photo.likes
      .find(l => l.user_id == req.session.loggedUser._id));

    if (indexForRemoval === -1) {
      // this user never liked the photo. This is an error
      res.sendStatus(400);
      return;
    }

    const removed = photo.likes.splice(indexForRemoval, 1);
    const savedPhoto = await Photo.findByIdAndUpdate(photo._id, photo);
    res.end(JSON.stringify(removed[0]));
  } 
  catch (e) {
    sendError('Error at /unlikePhoto/:id', e, res);
  }
});

/*
  Process an uploaded photo from the current session.loggedUser, sent
  in the POST request body. Writes the photo in the images folder, after
  appending an unique name tag based on the current Date to the file name.
  Update database tables to reflect the new photo for the user.
*/
app.post('/photos/new', async (req, res) => {
  if (!checkLoggedUser(req, res)) {
    return;
  }

  processFormBody(req, res, async (err) => {
    if (err || !req.file) {
      res.sendStatus(400);
      return;
    }
    const timestamp = new Date().valueOf();
    const filename = 'U' + String(timestamp) + req.file.originalname;

    fs.writeFile("./images/" + filename, req.file.buffer, async (err) => {
      try {
        const photo = {
          file_name: filename, date_time: Date.now(),
          user_id: req.session.loggedUser,
          comments: []
        };
        const savedPhoto = await Photo.create(photo);

        const act = {
          activity_type: ACTIVITY_PHOTO_UPLOAD, 
          date_time: Date.now(),
          user_name: req.session.loggedUser.first_name
            + " " + req.session.loggedUser.last_name,
          photo_file_name: savedPhoto.file_name
        };
        const savedAct = await Activity.create(act);

        const user = await User.findById(req.session.loggedUser._id);
        user.last_activity = savedAct;
        const savedUser = await user.save();
        res.end();
      } 
      catch (e) {
        sendError('Error at /photos/new', e, res);
      }
    });
  });
});

var server = app.listen(3000, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});

