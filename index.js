const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require("mongoose");
const { Schema } = mongoose;

// mongoose schemas
mongoose.connect(process.env.database);

const userSchema = new Schema({
  username: { type: String, unique: true }
},
{ versionKey: false }
);

const User = mongoose.model("User", userSchema);

const exercisesSchema = new Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date,
  user_id: String,
},
{ versionKey: false }
);

const Exercise = mongoose.model("Exercise", exercisesSchema);



app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// write user post
app.post("/api/users", async (req, res) => {
  console.log(req.body.username)
  const userName = req.body.username;
  //check if user already exists then insert if not
  const checkUser = await User.findOne({ username: userName });
  if (checkUser) {
    res.json({username: checkUser.username,
      _id: checkUser._id,
    })
  } else {
    const insertUser = new User({
    username: userName
    });
    const saveUser = await insertUser.save();
    res.json({ username: saveUser.username,
      _id: saveUser._id,
   });
  }
  
})

// get user data
app.get("/api/users", async (req, res) =>{
  const userList = await User.find();
  res.send(userList);
})

// write exercise post using user _id
app.post("/api/users/:_id/exercises", async (req, res) => {
  const id = req.params._id;
  const description = req.body.description;
  const duration = req.body.duration;
  const date = req.body.date;

  // check if valid id
  const userInfo = await User.findOne({ _id: id});
  console.log(userInfo)
  if (!userInfo) {
    res.json({ error: "ID not found"})
  } else {
    const insertExercise = new Exercise({
      username: userInfo.username,
      description: description,
      duration: duration,
      date: date ? new Date(date) : new Date(),
      user_id: id,
    });
    console.log(insertExercise)

    const saveExercise = await insertExercise.save();
    res.json({
      _id: userInfo._id,
      username: userInfo.username,
      date: saveExercise.date.toDateString(),
      duration: saveExercise.duration,
      description: saveExercise.description,
    });
  }
})

// exercise get logs
app.get("/api/users/:_id/logs", async (req, res) => {
  let { from, to, limit } = req.query;

  const id = req.params._id
  console.log(id)
  const userInfo = await User.findOne({ _id: id });
  console.log(userInfo)
  if (!userInfo) {
    res.json({ error: "ID not found"})
  } else {

    const filter = { user_id: id }
    let dateFilter = {};
    if (from) {
      dateFilter["$gte"] = new Date(from);
    };
    if (to) {
      dateFilter["$lte"] = new Date(to);
    };
    if (from || to) {
      filter.date = dateFilter;
    };

    const logs = await Exercise.find(filter).limit(Number(limit) ?? 100);

    const logFormat = logs.map((exercise) => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    }))

    res.json({
      _id: userInfo._id,
      username: userInfo.username,
      count: logs.length,
      log: logFormat,
    })
  }
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
