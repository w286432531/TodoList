//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const _ = require('lodash');
// setup schema
const { Schema } = mongoose;
// connect mongoDB
mongoose.connect('mongodb+srv://jay:w3213586@cluster0.iwwxk.mongodb.net/todolistDB?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true});
app.set('view engine', 'ejs');
// add bodyParser
app.use(bodyParser.urlencoded({extended: true}));
// add resourse
app.use(express.static("public"));

mongoose.set('useFindAndModify', false);
// create Schema
const itemsSchema = new Schema({
  name: String
});
// create model
const Item = mongoose.model("Item", itemsSchema);
// create some default items
const item1 = new Item({
  name: "Welcome to your todolist."
});
const item2 = new Item({
  name: "Hit the + button to add new items."
});
const item3 = new Item({
  name: "Check the checkbox to delete an item."
});
// name default items
const defaultItems = [item1, item2, item3];

// create schema for lists
const listSchema = new Schema({
  name: String,
  items: [itemsSchema]
});
// create model for lists
const List= mongoose.model("List", listSchema);

// get home route
app.get("/", function(req, res) {

// find items in item collection
  Item.find((err, result)=>{
    // check if items is empty, add default items if empty
    if (result.length === 0){
    // insert default items and check for error
    Item.insertMany(defaultItems,(error)=>{
      if (error){
        return console.error(error)};
    });
    // redirect after adding default items
    res.redirect("/");
  };
  // check for error when finding items
    if (err){
      return console.error(err);
    }
     // render list page inside views folder, pass in result as newListItems
    res.render("list", {listTitle: "Today", newListItems: result});
  });



});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const newItem = new Item({
    name: itemName
  });
  if (listName=== "Today"){
    newItem.save((err)=> {if (err) return console.error(err)});
    res.redirect("/");
  } else {
    List.findOne({name:listName},(err,result)=>{
      result.items.push(newItem);
      result.save();
      res.redirect("/"+ listName);
    });
  }
});
app.post("/delete", function(req,res){
  const checkedItemId= req.body.checkbox;
  const listName= req.body.listName;

  if (listName==="Today"){
    Item.findByIdAndRemove(checkedItemId,(err)=>{
      if (err) {
        return console.error(err);
      };
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      {name:listName},
      {$pull:{items:{_id:checkedItemId}}},
      (err,result)=>{
        if (err){
          return console.error(err);
        } else {
          res.redirect("/"+ listName);}
      }
    );
  }
  // Item.deleteOne({_id:checkedItemId}, (err)=>{
  //   if (err){
  //     return console.error(err);
  //   };
  // });

});
app.get("/:pageName",(req,res)=>{
  const pageName= _.capitalize(req.params.pageName);
  List.findOne({name:pageName},(err, result)=>{
    if (!err){
      if (!result) {
        //  Create a new list
        const list= new List({
          name: pageName,
          items: defaultItems
        });
          list.save((err)=> {if (err) return console.error(err)});
          res.redirect("/" + list.name);
      } else {
        //  show an existing list
        res.render("list", {listTitle: result.name, newListItems: result.items})
      }
    }
  });

});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
