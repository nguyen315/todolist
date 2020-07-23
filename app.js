const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");


const app = new express();

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

const itemSchema = new mongoose.Schema({
  listName: String,
  items: []
});

const Item = new mongoose.model("Item", itemSchema);

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static('public'));


app.get("/", function(req, res) {

  Item.find({}, function(err, foundItem){

    res.render('index', {
      lists: foundItem,
    });
  });

});

app.post("/", function(req, res) {
  let typeOfPost = req.body.button;

  if (typeOfPost === 'list') {
    let newListName = req.body.newList;

    let foo = Item.find({}, function(err, foundItem) {
      let alreadyHave = false;
      for (let i = 0; i < foundItem.length; i++) {

        // kiểm tra xem đã tồn tại list đó hay chưa
        

        if (foundItem[i].listName == newListName) {
          alreadyHave = true;
          break;
        }

      }

      if (!alreadyHave) {
        const newList = new Item ({
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
    console.log(newItem);
    

    if (newItem.length > 0) {

      Item.findOneAndUpdate(

        {listName: curListName},
        {$push: {items: newItem}},


        function (error) {
          if (error) {
              console.log(error);
          } else {
              console.log("add item successfully!");
          }
        }
      );
    }
  }

  res.redirect('/');
});

app.post("/delete", function(req, res) {
  const item = req.body;

  console.log(item);
  const key = Object.keys(item)[0];
  const value = item[key];

  console.log(key + " " + value);
  
  Item.updateOne(
    {listName: key},
    {$pull: {items: value}},


    function (err) {
      if (err) {
        console.log(err);
      } 
      else {
        console.log("delete item successfully!");
      }
    }
  );
  
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
