const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");



const app = new express();

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

const itemSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  }
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

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static('public'));


app.get("/", function(req, res) {

  List.find({}, function(err, foundList){

    res.render('index', {
      lists: foundList,
    });
  });

});

app.post("/", function(req, res) {
  let typeOfPost = req.body.button;

  if (typeOfPost === 'list') {
    let newListName = req.body.newList;
    
    let foo = List.find({}, function(err, foundLists) {
      let alreadyHave = false;
      for (let i = 0; i < foundLists.length; i++) {
        // kiểm tra xem đã tồn tại list đó hay chưa
        if (foundLists[i].listName == newListName) {
          alreadyHave = true;
          break;
        }
      }

      if (!alreadyHave) {
        const newList = new List ({
          listName: newListName,
          items: []
        });

        newList.save( function(err) {
          if (err) 
            console.log(err);
          else 
            console.log("add new list successfully");            
        });
      }
      else {
        console.log("already have this list");
      }
    });
  }

  else {
    let curListName = typeOfPost;

    console.log(curListName);
    
    // push item vào list tương ứng
    let newItem = req.body.newItem;   
    if (newItem.length > 0) {
      newItem = new Item({
        content: newItem
      });

      // newItem.save(function(err) {
      //   if (err) console.log(err);
      //   else console.log("add item successfully!");
      // });

      List.findOneAndUpdate(

        {listName: curListName},
        {$push: {items: newItem}},

        function (error) {
          if (error) {
              console.log(error);
          }
        }
      );
    }
  }
  res.redirect('/');
});

app.post("/deleteItem", function(req, res) {
  const item = req.body;
  const key = Object.keys(item)[0];
  const value = item[key];

  // pull item ra khỏi items
  List.updateOne(
    {listName: key},
    {$pull: {items: {_id: value}}},

    function (err) {
      if (err) {
        console.log(err);
      } 
      else {
        console.log("delete item successfully!");
      }
    }
  );

  // xóa item
  // Item.deleteOne({_id: value}, function(err) {
  //   if (err) console.log(err);
  //   else console.log("delete successfully " + value);
  // });
  
  res.redirect("/");
});

app.post("/deleteList", function(req, res) {
  const idOfList = req.body.buttonDelete;

  List.findOne({_id: idOfList}, function(err, foundList) {
    foundList.items.forEach(function(item) {
      Item.deleteOne({_id: item._id}, function(err){
        if (err) console.log(err);
      });
    });
  });
  
  List.deleteOne({_id: idOfList}, function(err) {
    if (err) console.log(err);
    else console.log("delete successful list.");
  });

  res.redirect("/");
});
//let port = process.env.PORT;

let port = 3000;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function(){
  console.log("Server start successfully!");
  
});
