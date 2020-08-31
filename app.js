const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = new express();

// SET UP
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static('public'));
app.use(session({
  secret: "secret message to sign in user",
  resave: false,
  saveUninitialized: false

}));
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});
mongoose.set('useCreateIndex', true)

const itemSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },

});
const Item = new mongoose.model("Item", itemSchema);

const listSchema = new mongoose.Schema({
  listName: {
    type: String,
    required: true
  },
  items: [itemSchema]
});
const List = new mongoose.model("List", listSchema);

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true
  },
  password: {
    type: String
  },
  lists: [listSchema]
});

userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy()); 
// used to serialize the user for the session
passport.serializeUser(function(user, done) {
  done(null, user.id); 
 // where is this user.id going? Are we supposed to access this anywhere?
});

// used to deserialize the user
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
      done(err, user);
  });
});





// GET 
app.get("/", function(req, res) {
  res.render("home");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/index", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("index", {
      lists: req.user.lists
    });
  }
  else {
    res.redirect("/login");
  }
});



// POST

app.post("/register", function(req, res) {
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    }
    else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/index");
      });
    }
  })
});

app.post("/login", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err){
      console.log(err);
      res.redirect("/login");
    }
    else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/index");
      });
    }
  })
});

app.post("/", function(req, res) {
  let typeOfPost = req.body.button;

  if (typeOfPost === 'list') {
    let newListName = req.body.newList;

    let lists = req.user.lists;
    let existedList = false;
    lists.forEach(function(list) {
      if (list.listName === newListName) {
        console.log("already have this list.");
        existedList = true;
      }
    });

    if (!existedList) {
      const newList = new List({
        listName: newListName,
        items: []
      });

      req.user.lists.push(newList);
      req.user.save(function(err) {
        if (err) {
          console.log(err);
        }
        else {
          console.log("save list " + newListName + " success.");
        }
      });
    }
    else {
      console.log("list name existed.");
    }
  }

  // typeOfPost === tên của list 
  else {
    let listID = typeOfPost;

    console.log(listID);
    
    // push item vào list tương ứng
    let newItem = req.body.newItem;   
    if (newItem.length > 0) {
      newItem = new Item({
        content: newItem
      });

      let modifyList = req.user.lists.find(list => list._id == listID);
      modifyList.items.push(newItem);
      req.user.save(function(err) {
        if (err) {
          console.log(err);
        }
      });
    }
  }
  res.redirect('/index');
});


app.post("/deleteList", function(req, res) {
  const idOfList = req.body.buttonDelete;

  req.user.lists = req.user.lists.filter(function(obj) {
    return obj._id != idOfList;
  });

  req.user.save(function(err) {
    if (err) {
      console.log(err);
    }
  });

  res.redirect("/index");
});

app.post("/deleteItem", function(req, res) {
  const deleteItem = req.body;
  const listID = Object.keys(deleteItem)[0];
  const deleteItemID = deleteItem[listID];

  let lists = req.user.lists;

  for (let i = 0; i < lists.length; i++) {
    if (lists[i]._id == listID) {
      lists[i].items = lists[i].items.filter(function(obj) {
        return obj._id != deleteItemID;
      });
      break;
    }
  }

  req.user.save(function(err) {
    if (err) {
      console.log(err);
    }
  });

  res.redirect("/index");
});





// RUN
//let port = process.env.PORT;

let port = 3000;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function(){
  console.log("Server start");
});
