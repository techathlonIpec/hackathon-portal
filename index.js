const express = require('express');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt')
const mongoose = require('mongoose');
const passport = require("passport")
const flash = require("express-flash")
const session = require("express-session")
var Ddos = require('ddos')

// DDOS PROTECTION
var ddos = new Ddos;

const app = express();

const teamsCollection = require('./models/teams.js');
const questionCollection = require('./models/questions.js');
const { checkAuthenticated, checkUnAuthenticated, checkEventTime } = require('./authFunctions')

dotenv.config()

// CONNECTION
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
}, (err) => {
    if (err)
        console.log(`Error ${err}`);
    else
        console.log("Connected to MongoDB");

})
app.use(express.urlencoded({ extended: false }));
app.use(ddos.express)
app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/public'))

app.set('trust proxy', 1)
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

const initializePassport = require('./passport-config');

initializePassport(passport,
    teamName => teamsCollection.findOne({ teamName: teamName.toLowerCase() }).then(team => team),
    id => teamsCollection.findById(id).then(team => team)
)

app.post('/register', checkUnAuthenticated, (req, res) => {
    var teamName = (req.body.teamName).toLowerCase();
    teamsCollection.findOne({ teamName: teamName }).then(team => {
        if (team) return res.status(400).send({ done: false, message: 'Team already Exists.' })
        let data = {}
        data.teamName = teamName
        data.password = bcrypt.hashSync(req.body.password, 10)
        data.gitHubRepoLink = "https://github.com/ipectrinity/" + teamName;
        data.accountType = req.body.accountType ? req.body.accountType : 'participants'
        new teamsCollection(data).save((err, registeredTeam) => {
            if (err) {
                console.log(`Error ${err}`);
                res.send({ done: false, message: 'Unknown Error Occurred!' })
            }
            else {
                res.send({ done: true, registeredTeam, message: 'Participant Registered Successfully' });
            }
        })
    })
})

app.post("/login", checkEventTime, passport.authenticate('local', {
    successRedirect: '/eventPage',
    failureRedirect: '/',
    failureFlash: true
}))

app.get('/', checkEventTime, checkUnAuthenticated, (req, res) => {
    res.render('index.ejs')
})

app.get('/eventPage', checkEventTime, checkAuthenticated, (req, res) => {
    // We find the user first
    teamsCollection.findOne({ teamName: req.user.teamName }).then(team => {
        if (!team) return res.status(400).send({ done: false, message: 'No Team found with the given teamName.' })

        // We look into account type
        if (team.accountType === 'participants') {
            // We find that if they have topic already decided
            if (team.topicSelected === 0) {
                questionCollection.find().then(questions => {
                    if (questions) {
                        res.render('eventPage.ejs', { team: team, topics: questions })
                    }
                })
                // We render the Dashboard where the Topic Selection is Available
            }
            else {
                teamsCollection.find({ accountType: 'participants' }).sort({ TotalAvgScore: -1 }).limit(10).then(leaderBoardTeams => {
                    questionCollection.findOne({ topicNumber: team.topicSelected }).then(topicSelected => {
                        res.render('teamDashboard.ejs', { team: team, leaderboard: leaderBoardTeams, topicSelected: topicSelected })
                    })
                })

                // We render the page where the selected topic is displayed and Leaderboard on the right
            }
        }
        else {
            teamsCollection.find({ accountType: 'participants' }).then(teams => {
                res.render('judgeDashboard.ejs', { team: req.user, teams: teams })
            })

            // We render the Judge Dashboard, with list of team and there hosting
        }

    })


})

app.post('/submitTopic', checkEventTime, checkAuthenticated, (req, res) => {
    teamsCollection.findOneAndUpdate({ teamName: req.user.teamName }, { topicSelected: req.body.topicSelected, hostedWebAppLink: req.body.hostedWebAppLink }).then(updatedTeam => {
        if (updatedTeam) {
            req.flash('success', 'Team Topic has been submitted succesfully')
            res.redirect('/eventPage')
        }
        else {
            req.flash('error', 'Unknown Error Occurred. Contact Trinity Team')
            res.redirect('/eventPage')
        }
    })
})

app.post('/addQuestion', (req, res) => {
    let data = {}
    data.topicNumber = req.body.topicNumber;
    data.topic = req.body.topic;
    data.topicStatement = req.body.topicStatement
    new questionCollection(data).save((err, question) => {
        if (err) {
            console.log(`Error ${err}`);
            res.send({ done: false, message: 'Unknown Error Occured!' });
        }
        else {
            res.send({ done: true, message: 'Question created Successfully!', question });
        }
    });
})

app.get('/teamPage', checkEventTime, checkAuthenticated, (req, res) => {
    if (req.user.accountType === 'judge') {
        teamsCollection.findOne({ teamName: req.query.teamName }).then(team => {
            if (team) {
                if (team.judgeRound < 5) {
                    if (team.topicSelected != 0) {
                        questionCollection.findOne({ topicNumber: team.topicSelected }).then(topic => {
                            res.render('teamPage.ejs', { Theteam: team, topic: topic })
                        })
                    }
                    else {
                        req.flash('bigMessage', 'This team has not selected any topic. Can not Judge them.')
                        res.render('bigMessage.ejs')
                    }
                }
                else {
                    req.flash('bigMessage', 'This team has been judged for all three rounds')
                    res.render('bigMessage.ejs')
                }
            }
        })
    }
    else {
        req.flash('bigMessage', "This page is forbidden to participants")
        res.render('bigMessage.ejs')
    }
})

app.post('/submitMarks', checkEventTime, checkAuthenticated, (req, res) => {
    if (req.user.accountType === 'judge') {
        teamsCollection.findOne({ teamName: req.body.teamName }).then(team => {
            if (team) {
                team.judgementScoreOne = (Number(team.judgementScoreOne) + Number(req.body.judgementScoreOne)) / team.judgeRound
                team.judgementScoreTwo = (Number(team.judgementScoreTwo) + Number(req.body.judgementScoreTwo)) / team.judgeRound
                team.judgementScoreThree = (Number(team.judgementScoreThree) + Number(req.body.judgementScoreThree)) / team.judgeRound
                team.judgementScoreFour = (Number(team.judgementScoreFour) + Number(req.body.judgementScoreFour)) / team.judgeRound
                team.TotalAvgScore = (team.judgementScoreOne + team.judgementScoreTwo + team.judgementScoreThree + team.judgementScoreFour) / (4)
                team.judgeRound++
                team.save().then(savedTeam => {
                    if (savedTeam) {
                        req.flash('success', `This marks has been added for this teams round ${savedTeam.judgeRound - 1}`)
                        res.redirect('/teamPage?teamName=' + savedTeam.teamName)
                    }
                    else {
                        req.flash('error', 'Could not Update marks. Contact Trinity Team.')
                        res.redirect('/eventPage')
                    }
                })
            }
            else {
                req.flash('error', 'Something Unknown Happened')
                res.redirect('/eventPage')
            }
        })
    }
    else {
        res.send('Forbidden to participant')
    }
})

app.get('/leaderboard', (req, res) => {
    teamsCollection.find({ accountType: 'participants' }).sort({ TotalAvgScore: -1 }).limit(10).then(teams => {
        res.render('leaderboard.ejs', { teams })
    })
})

app.get('/message', (req, res) => {
    res.render('bigMessage.ejs')
})

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server is listening");
});




