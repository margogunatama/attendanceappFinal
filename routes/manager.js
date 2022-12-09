var express = require('express');
var router = express.Router();
var User = require('../models/user');
var Leave = require('../models/leave');
var Attendance = require('../models/attendance');
var moment = require('moment');
var flash = require('connect-flash');
var csrf = require('csurf');
var csrfProtection = csrf();

router.use('/', isLoggedIn, function checkAuthentication(req, res, next) {
    next();
});


router.get('/', function viewHomePage(req, res, next) {
    Attendance.findOne({
        employeeID: req.session.user._id,
        month: new Date().getMonth()+ 1,
        date: new Date().getDate(),
        year: new Date().getFullYear(),
    }).exec(function getAttendance(err, docs){

    res.render('Manager/managerHome', {
        title: 'Manager Home',
        csrfToken: req.csrfToken(),
        userName: req.session.user.name,
        moment: moment,
        present: docs ? docs.present : false,
        isPulang: docs ? docs.waktupulang : false
    });
})
});

router.get('/view-employees', function viewAllEmployees(req, res, next) {

    var userChunks = [];
    var chunkSize = 3;
    Attendance.findOne({
        employeeID: req.session.user._id,
        month: new Date().getMonth()+ 1,
        date: new Date().getDate(),
        year: new Date().getFullYear(),
    }).exec(function getAttendance(err, docs2){
    User.find({$or: [{type: 'Pegawai',}]}).sort({_id: -1}).exec(function getUsers(err, docs) {
        for (var i = 0; i < docs.length; i++) {
            userChunks.push(docs[i]);
        }
        res.render('Manager/managerviewAllEmployee', {
            title: 'All Employees',
            csrfToken: req.csrfToken(),
            users: userChunks,
            moment: moment,
            present: docs2 ? docs2.present : false,
            isPulang: docs2 ? docs2.waktupulang : false,
            userName: req.session.user.name
        });
    });
});


});

router.post('/mark-manager-attendance',async function markEmployeeAttendance(req, res, next) {
    const attendance =  await Attendance.findOneAndUpdate({
        employeeID: req.user._id,
        month: new Date().getMonth()+ 1,
        date: new Date().getDate(),
        year: new Date().getFullYear(),
    }, {waktupulang:req.body.waktupulang})

    if(!attendance){
            var jam = req.body.waktumasuk.substring(0, 2)
            if(jam > 8){
                keterangan = "Terlambat"
            } else if(jam <= 8){
                keterangan = "Tepat Waktu"
            } 
            var newAttendance = new Attendance();
            newAttendance.employeeID = req.user._id;
            newAttendance.year = new Date().getFullYear();
            newAttendance.month = new Date().getMonth() + 1;
            newAttendance.date = new Date().getDate();
            newAttendance.present = 1;
            newAttendance.waktumasuk = req.body.waktumasuk;
            newAttendance.waktupulang = 0;
            newAttendance.keterangan = keterangan;
            newAttendance.save(function saveAttendance(err) {
                if (err) {
                    console.log(err);
                }

            });
        }
        setTimeout(render_view, 900);
        function render_view() {
        res.redirect('/manager/view-attendance-current');
        }

    });

module.exports = router;

router.get('/leave-applications', function getLeaveApplications(req, res, next) {

    var leaveChunks = [];
    var employeeChunks = [];
    var temp;
    //find is asynchronous function
    Attendance.findOne({
        employeeID: req.session.user._id,
        month: new Date().getMonth()+ 1,
        date: new Date().getDate(),
        year: new Date().getFullYear(),
    }).exec(function getAttendance(err, docs2){
    Leave.find({}).sort({}).exec(function findAllLeaves(err, docs) {
        var hasLeave = 0;
        if (docs.length > 0) {
            hasLeave = 1;
        }
        for (var i = 0; i < docs.length; i++) {
            leaveChunks.push(docs[i])
        }
        for (var i = 0; i < leaveChunks.length; i++) {

            User.findById(leaveChunks[i].applicantID, function getUser(err, user) {
                if (err) {
                    console.log(err);
                }
                employeeChunks.push(user);

            })
        }

        // call the rest of the code and have it execute after 3 seconds
        setTimeout(render_view, 900);
        function render_view() {
            res.render('Manager/allApplications', {
                title: 'Approval Lembur',
                csrfToken: req.csrfToken(),
                hasLeave: hasLeave,
                leaves: leaveChunks,
                employees: employeeChunks, 
                moment: moment, 
                present: docs2 ? docs2.present : false,
                isPulang: docs2 ? docs2.waktupulang : false,
                userName: req.session.user.name
            });
        }
    });
});


});



router.get('/respond-application/:leave_id/:employee_id', function respondApplication(req, res, next) {
    var leaveID = req.params.leave_id;
    var employeeID = req.params.employee_id;
    Attendance.findOne({
        employeeID: req.session.user._id,
        month: new Date().getMonth()+ 1,
        date: new Date().getDate(),
        year: new Date().getFullYear(),
    }).exec(function getAttendance(err, docs2){
    Leave.findById(leaveID, function getLeave(err, leave) {

        if (err) {
            console.log(err);
        }
        User.findById(employeeID, function getUser(err, user) {
            if (err) {
                console.log(err);
            }
            res.render('Manager/applicationResponse', {
                title: 'Approval Lembur',
                csrfToken: req.csrfToken(),
                leave: leave,
                employee: user,
                moment: moment, 
                present: docs2 ? docs2.present : false,
                isPulang: docs2 ? docs2.waktupulang : false,
                userName: req.session.user.name
            });


        })


    });
});


});



router.get('/view-attendance-current', function viewCurrentlyMarkedAttendance(req, res, next) {
    var attendanceChunks = [];

    Attendance.find({
        employeeID: req.session.user._id,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    }).sort({_id: -1}).exec(function getAttendanceSheet(err, docs) {
        var found = 0;
        if (docs.length > 0) {
            found = 1;
        }
        for (var i = 0; i < docs.length; i++) {
            attendanceChunks.push(docs[i]);
        } 
        Attendance.findOne({
            employeeID: req.session.user._id,
            month: new Date().getMonth()+ 1,
            date: new Date().getDate(),
            year: new Date().getFullYear(),
        }).exec(function getAttendance(err, docs){
            res.render('Manager/viewAttendance', {
                title: 'Attendance Sheet',
                month: req.body.month,
                csrfToken: req.csrfToken(),
                found: found,
                attendance: attendanceChunks,
                moment: moment,
                present: docs ? docs.present : false,
                isPulang: docs ? docs.waktupulang : false,
                userName: req.session.user.name
            });
        })
    });
});

router.get('/view-profile', function viewProfile(req, res, next) {
    Attendance.findOne({
        employeeID: req.session.user._id,
        month: new Date().getMonth()+ 1,
        date: new Date().getDate(),
        year: new Date().getFullYear(),
    }).exec(function getAttendance(err, docs2){

    User.findById(req.user._id, function getUser(err, user) {
        if (err) {
            console.log(err);

        }
        
        res.render('Manager/viewManagerProfile', {
            title: 'Profile',
            csrfToken: req.csrfToken(),
            employee: user,
            moment: moment,
            present: docs2 ? docs2.present : false,
            isPulang: docs2 ? docs2.waktupulang : false,
            userName: req.session.user.name
        });
    });
});

});

router.post('/view-attendance', function viewAttendanceSheet(req, res, next) {
    var attendanceChunks = [];
    Attendance.find({
        employeeID: req.session.user._id,
        month: req.body.month,
        year: req.body.year
    }).sort({_id: -1}).exec(function getAttendance(err, docs) {
        var found = 0;
        if (docs.length > 0) {
            found = 1;
        }

        for (var i = 0; i < docs.length; i++) {
            attendanceChunks.push(docs[i]);
        }
        Attendance.findOne({
            employeeID: req.session.user._id,
            month: new Date().getMonth()+ 1,
            date: new Date().getDate(),
            year: new Date().getFullYear(),
        }).exec(function getAttendance(err, docs){
            res.render('Manager/viewAttendance', {
                title: 'Attendance Sheet',
                month: req.body.month,
                csrfToken: req.csrfToken(),
                found: found,
                attendance: attendanceChunks,
                moment: moment,
                present: docs ? docs.present : false,
                isPulang: docs ? docs.waktupulang : false,
                userName: req.session.user.name
            });
        })
    });


});



router.post('/mark-manager-attendance',async function markEmployeeAttendance(req, res, next) {
    const attendance =  await Attendance.findOneAndUpdate({
        employeeID: req.user._id,
        month: new Date().getMonth()+ 1,
        date: new Date().getDate(),
        year: new Date().getFullYear(),
    }, {waktupulang:req.body.waktupulang})

    if(!attendance){
            var jam = req.body.waktumasuk.substring(0, 2)
            if(jam > 8){
                keterangan = "Terlambat"
            } else if(jam <= 8){
                keterangan = "Tepat Waktu"
            } 
            var newAttendance = new Attendance();
            newAttendance.employeeID = req.user._id;
            newAttendance.year = new Date().getFullYear();
            newAttendance.month = new Date().getMonth() + 1;
            newAttendance.date = new Date().getDate();
            newAttendance.present = 1;
            newAttendance.waktumasuk = req.body.waktumasuk;
            newAttendance.waktupulang = 0;
            newAttendance.keterangan = keterangan;
            newAttendance.save(function saveAttendance(err) {
                if (err) {
                    console.log(err);
                }

            });
        }
        res.redirect('/manager/view-attendance-current');

    });

module.exports = router;



function isLoggedIn(req, res, next) {

    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}