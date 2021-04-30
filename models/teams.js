const mongoose = require('mongoose');

const schema = mongoose.Schema;

const teamSchema = new schema({
    teamName: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    accountType: {
        type: String,
        required: true,
        default: 'participants'
    },
    topicSelected: {
        type: Number,
        required: true,
        default: 0
    },
    gitHubRepoLink: {
        type: String,
        required: true
    },
    hostedWebAppLink: {
        type: String,
        required: true,
        default: 'None'
    },
    judgementScoreOne: {
        type: Number,
        required: true,
        default: 0,
        max: 20
    },
    judgementScoreTwo: {
        type: Number,
        required: true,
        default: 0,
        max: 20
    },
    judgementScoreThree: {
        type: Number,
        required: true,
        default: 0,
        max: 20
    },
    judgementScoreFour: {
        type: Number,
        required: true,
        default: 0,
        max: 20
    },
    TotalAvgScore: {
        type: Number,
        required: true,
        default: 0,
        max: 20
    },
    judgeRound: {
        type: Number,
        required: true,
        default: 1,
        max: 4
    }

});

const participantModel = mongoose.model('teams', teamSchema);
module.exports = participantModel;

