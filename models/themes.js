const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const themeSchema = new Schema({
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


const themeModel = mongoose.model('theme', themeSchema);
module.exports = themeModel;
