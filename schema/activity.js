"use strict";

var mongoose = require('mongoose');

var activitySchema = new mongoose.Schema({
    activity_type: Number, 
    date_time: {type: Date, default: Date.now}, 
    user_name: String, 
    photo_file_name: String,
    comment_text: String
});

// the schema is useless so far
// we need to create a model using it
var Activity = mongoose.model('Activity', activitySchema) ;

// make this available to our photos in our Node applications
module.exports = Activity ;