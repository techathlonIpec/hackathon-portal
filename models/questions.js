const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const questionSchema = new Schema({
    themeNumber: {
        type: Number,
        required: true,
        unique: true,
        dropDups: true
    },
    themeID: {
        type: String,
        required: true,
    },
    themeStatement: {
        type: String,
        required: true
    },
});


const questionModel = mongoose.model('questions', questionSchema);
module.exports = questionModel;
