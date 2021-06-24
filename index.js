const express = require('express');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt')
const mongoose = require('mongoose');
const passport = require("passport")
const flash = require("express-flash")
const session = require("express-session")
var Ddos = require('ddos')
const { default: axios } = require('axios');

// DDOS PROTECTION
var ddos = new Ddos;

const app = express();

const teamsCollection = require('./models/teams.js');
const themeCollection = require('./models/themes.js');
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
    let teamName = (req.body.teamName).toLowerCase();
    teamsCollection.findOne({ teamName: teamName }).then(team => {
        if (team) return res.status(400).send({ done: false, message: 'Team already Exists.' })
        let data = {}
        data.teamName = teamName
        data.password = bcrypt.hashSync(req.body.password, 10)
        data.gitHubRepoLink = "https://github.com/Hackathon21/" + teamName;
        data.accountType = req.body.accountType ? req.body.accountType : 0;
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
    teamsCollection.findOne({ teamName: req.user.teamName }).then(async team => {
        if (!team) return res.status(400).send({ done: false, message: 'No Team found with the given teamName.' })
        // We look into account type
        if (team.accountType === 0) {
            themeCollection.find().then(themes => {
                if (themes) {
                    let gitLink = `https://api.github.com/repos/${team.gitHubRepoLink.slice(19)}/commits`;
                    axios.get(gitLink, {
                        headers: {
                            Authorization: `token ${process.env.GITHUB_TOKEN}`
                        }
                    }).then(({ data }) => {
                        let latestCommit = data[0]
                        let today = new Date()
                        let latestCommitDate = new Date(latestCommit.commit.committer.date)
                        team.lastCommit = latestCommitDate
                        team.save()
                        let commitDateString = `${latestCommitDate.getDate()}/${latestCommitDate.getMonth()}/${latestCommitDate.getYear()} Time: ${latestCommitDate.getHours()}:${latestCommitDate.getMinutes()}`
                        console.log(latestCommitDate);
                        if (latestCommitDate.getDate() == today.getDate()) {
                            let hourDiffer = today.getHours() - latestCommitDate.getHours()
                            console.log(hourDiffer)
                            if (hourDiffer > 2) {
                                req.flash('error', 'Your team has not commited for the last ' + hourDiffer + ' hours.')
                            }
                        }
                        else {
                            req.flash('error', 'Your team has not commited from yesterday.')
                        }
                        res.render('eventPage.ejs', { team: team, themes: themes, latestCommit, commitDateString })
                    })
                        .catch(exp => {
                            console.error(exp);
                            res.send("Some Unknown Error Occurred while fetching your GitHub Info. Contact Team.")
                        })
                }
            })
            // We render the Dashboard where the Topic Selection is Available
        }
        else if (team.accountType === 1) {
            teamsCollection.find({ accountType: 0, $or: [{ judgeUserName: req.user.teamName }, { judgeTwoUserName: req.user.teamName }] }).then(async teams => {
                await setLastCommits(teams)
                res.render('judgeDashboard.ejs', { team: req.user, teams: teams })
            })

            // We render the Judge Dashboard, with list of team and there hosting
        }
        else if (team.accountType === 2) {
            teamsCollection.find({ accountType: 0 }).then(async (teams) => {
                await setLastCommits(teams)
                res.render('moderatorDashboard.ejs', { team: req.user, teams })
            })
        }
    })
})
// Helper Function
async function setLastCommits(teams) {
    teams.forEach(async team => {
        let gitLink = `https://api.github.com/repos/${team.gitHubRepoLink.slice(19)}/commits`;
        try {
            let { data } = await axios.get(gitLink)
            if ({ data }) {
                team.lastCommit = new Date(data[0].commit.committer.date)
                team.save()
            }
        }
        catch (e) {
            //Do nothing
        }
    })
}

app.post('/submitTopic', checkEventTime, checkAuthenticated, (req, res) => {
    teamsCollection.findOneAndUpdate({ teamName: req.user.teamName }, { themeSelected: req.body.themeSelected, solutionLink: req.body.solutionLink }).then(updatedTeam => {
        if (updatedTeam) {
            req.flash('success', 'Team Profile has been updated succesfully')
            res.redirect('/eventPage')
        }
        else {
            req.flash('error', 'Unknown Error Occurred. Contact Techathlon Team')
            res.redirect('/eventPage')
        }
    })
})

app.post('/addTheme', (req, res) => {
    let data = {}
    data.themeNumber = req.body.themeNumber;
    data.themeID = req.body.themeID;
    data.themeStatement = req.body.themeStatement
    new themeCollection(data).save((err, question) => {
        if (err) {
            console.log(`Error ${err}`);
            res.send({ done: false, message: 'Unknown Error Occured!' });
        }
        else {
            res.send({ done: true, message: 'Theme created Successfully!', question });
        }
    });
})

app.get('/teamPage', checkEventTime, checkAuthenticated, (req, res) => {
    if (req.user.accountType === 1) {
        teamsCollection.findOne({ teamName: req.query.teamName }).then(team => {
            if (team) {
                if (team.themeSelected != 0) {
                    themeCollection.findOne({ themeNumber: team.themeSelected }).then(theme => {
                        res.render('teamPage.ejs', { Theteam: team, theme: theme })
                    })
                }
                else {
                    req.flash('bigMessage', 'This team has not selected any theme. Can not Judge them.')
                    res.render('bigMessage.ejs')
                }
            }
        })
    }
    else {
        req.flash('bigMessage', "This page is accessible only by judges.")
        res.render('bigMessage.ejs')
    }
})

app.post('/submitMarks', checkEventTime, checkAuthenticated, (req, res) => {
    if (req.user.accountType === 1) {
        teamsCollection.findOne({ teamName: req.body.teamName }).then(team => {
            if (team) {
                if (team.scores[0] == 0) {
                    team.scores = [
                        Number(req.body.judgementScoreOne),
                        Number(req.body.judgementScoreTwo),
                        Number(req.body.judgementScoreThree),
                        Number(req.body.judgementScoreFour),
                    ]
                }
                else {
                    team.scores = [
                        (team.scores[0] + Number(req.body.judgementScoreOne)) / 2,
                        (team.scores[1] + Number(req.body.judgementScoreTwo)) / 2,
                        (team.scores[2] + Number(req.body.judgementScoreThree)) / 2,
                        (team.scores[3] + Number(req.body.judgementScoreFour)) / 2,
                    ]
                }
                team.totalScore = team.scores[0] + team.scores[1] + team.scores[2] + team.scores[4]
                team.save().then(savedTeam => {
                    if (savedTeam) {
                        req.flash('success', `This marks has been added for this team`)
                        res.redirect('/teamPage?teamName=' + savedTeam.teamName)
                    }
                    else {
                        req.flash('error', 'Could not Update marks. Contact Techathlon Team.')
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
/*
app.get('/', (req, res) => {
    teamsCollection.find({ accountType: 'participants' }).sort({ TotalAvgScore: -1 }).limit(10).then(teams => {
        res.render('leaderboard.ejs', { teams })
    })
})
*/
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




