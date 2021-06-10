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
    accountType: { // 0 - participant, 1 - judges, 2 - moderators, 3 - vip
        type: Number,
        required: true,
        default: 0
    },
    themeSelected: {
        type: Number,
        required: true,
        default: 0
    },
    gitHubRepoLink: {
        type: String,
        required: true
    },
    solutionLink: {
        type: String,
        required: false,
    },
    scores: {
        type: [Number],
        required: false,
        default: [0, 0, 0, 0]
    },
    lastCommit: {
        type: Date,
        required: false
    }
});

const participantModel = mongoose.model('teams', teamSchema);
module.exports = participantModel;

