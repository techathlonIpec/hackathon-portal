const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const questionSchema = new Schema({
    topicNumber: {
        type: Number,
        required: true,
        unique: true,
        dropDups: true
    },
    topic: {
        type: String,
        required: true,
    },
    topicStatement: {
        type: String,
        required: true
    },
});


const questionModel = mongoose.model('questions', questionSchema);
module.exports = questionModel;
