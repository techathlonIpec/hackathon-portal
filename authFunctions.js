function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect("/")
}

function checkUnAuthenticated(req, res, next) {
    if (!req.isAuthenticated()) {
        next()
    } else {
        res.redirect("/eventPage")
    }
}

function checkEventTime(req, res, next) {
    var eventFlag = process.env.EVENT_FLAG
    if (eventFlag == 'BEFORE') {
        req.flash('bigMessage', 'Oh Boy! You are Excited. But We are sorry. Event will start on 01st May 2021 (09:00 AM) ')
        return res.redirect('/message')
    }
    if (eventFlag == 'ONTIME') {
        next()
    }
    if (eventFlag == 'AFTER') {
        req.flash('bigMessage', 'Event is Over. Final Rounds Judgement will be shared with you soon.')
        return res.redirect('/message')
    }
}

module.exports = { checkAuthenticated: checkAuthenticated, checkUnAuthenticated: checkUnAuthenticated, checkEventTime }