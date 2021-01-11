const express = require('express')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const moment = require('moment');
const cors = require('cors')
mongoose.set('useFindAndModify', false);

const app = express()

require('dotenv').config()

app.use(cors({optionsSuccessStatus: 200}));
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Connecting Database
let db = mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Creating Schema
const userSchema = new mongoose.Schema({
    username: String,
    count: Number,
    log: [{
      _id: false,
      description: String,
      duration: Number,
      date: String
     }]
});

// Creating Model
const User = mongoose.model('User', userSchema);

app.post('/api/exercise/new-user', (req, res) => {
  const userName = req.body.username;
  
  var newUser = new User({username: userName, log: []});

  newUser.save(function(err, data) {
    if(err) return console.error(err);
    res.json(data);
  });
})

app.get('/api/exercise/users', (req, res) => {
  User.find({}, (error, data) => {
	  if(error) {
	      console.log(error)
    } else {
	    res.send(data);
    }
  })
})

app.post('/api/exercise/add', (req, res) => {
  const userId = req.body.userId;
  const deScription = req.body.description;
  const duRation = req.body.duration;
  if (req.body.date === "") {
    var daTe = new Date().toDateString();
  } else {
    daTe = new Date(req.body.date).toDateString();
  }
  var logs = {description: deScription, duration: duRation, date: daTe}
  User.findByIdAndUpdate(userId, { 
    $push: { log: logs }
    }, {new: true}, (err, data) => {
    if(err) return console.error(err);
    res.json({
      username: data.username,
      description: deScription,
      duration: parseInt(duRation),
      _id: userId,
      date: daTe
      });
  });
})

app.get('/api/exercise/log', (req, res) => {
  var userId = req.query.userId
  User.findById(userId, (error, data) => {
	  if(error) {
	    console.log(error)
  } else {
    var responseObj = data.log
    if (req.query.limit) {
      responseObj = data.log.slice(0, req.query.limit);
    }
    if (req.query.from) {
      responseObj = data.log.filter((exercise) =>
        moment(exercise.date, 'ddd MMM DD YYYY').isAfter(req.query.from)
      );
    }
    if (req.query.to) {
      responseObj = data.log.filter((exercise) =>
        moment(exercise.date, 'ddd MMM DD YYYY').isBefore(req.query.to)
      );
    }
    var countNum = data.log.length;
	  res.json({
      _id: data._id,
      username: data.username,
      count: countNum,
      log: responseObj
      });
   }
 })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})