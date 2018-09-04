"use strict";
/*
 *  Defined the Mongoose Schema and return a Model for a User
 */
/* jshint node: true */

var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;

// create a schema
var userSchema = new mongoose.Schema({
    first_name: String, // First name of the user.
    last_name: String,  // Last name of the user.
    location: String,    // Location  of the user.
    description: String,  // A brief user description
    occupation: String,    // Occupation of the user.
    login_name: String,
    password: String,
    last_activity: {type: mongoose.Schema.Types.ObjectId, ref: 'Activity'}
});

/*
  Added password hashing functionality, because initially passwords 
  were being stored as plain text
*/
userSchema.pre('save', function(next) {
  const user = this;

  if (!user.isModified('password')) {
    return next();
  }

  const salt = bcrypt.genSaltSync(SALT_WORK_FACTOR);
  const hashedPassword = bcrypt.hashSync(user.password, salt);
  user.password = hashedPassword;
  next();
});

userSchema.methods.comparePasswords = function(candidatePassword) {
  return bcrypt.compareSync(candidatePassword, this.password);
}

// the schema is useless so far
// we need to create a model using it
var User = mongoose.model('User', userSchema);

// make this available to our users in our Node applications
module.exports = User;
