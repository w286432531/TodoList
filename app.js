//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const _ = require('lodash');
// setup schema
const { Schema } = mongoose;
// connect to mongoDB Atlas
mongoose.connect('mongodb+srv://jay:w3213586@cluster0.iwwxk.mongodb.net/todolistDB?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true});
// use ejs
app.set('view engine', 'ejs');
// add bodyParser
app.use(bodyParser.urlencoded({extended: true}));
// add resourse
app.use(express.static("public"));
// add this for findOneAndUpdate to work
mongoose.set('useFindAndModify', false);
// create Schema for items
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
// set up post route
app.post("/", function(req, res){
// get new item from page
  const itemName = req.body.newItem;
  // get the list title name from page
  const listName = req.body.list;
  // create new item to save in database
  const newItem = new Item({
    name: itemName
  });
  // check where post route was send. home route is "Today"
  if (listName=== "Today"){
    // saving new item to items collection when it's home route
    newItem.save((err)=> {if (err) return console.error(err)});
    // redirect to home after saving data
    res.redirect("/");
  } else {
    // if the page is not home find the list with current page name
    List.findOne({name:listName},(err,result)=>{
      // add to the list.items
      result.items.push(newItem);
      // save to database
      result.save();
      // redirect after saving to database
      res.redirect("/"+ listName);
    });
  }
});
// create a delete post when checkbox is checked
app.post("/delete", function(req,res){
  // get the id for the checked item
  const checkedItemId= req.body.checkbox;
  // get the page name for the checked item
  const listName= req.body.listName;
// if page name is home which is "Today"
  if (listName==="Today"){
    // find and remove in the items collection
    Item.findByIdAndRemove(checkedItemId,(err)=>{
      // check for error
      if (err) {
        return console.error(err);
      };
    });
    // redirect after delete
    res.redirect("/");  }
   // if it's not home page
  else {
    // find the list and update data
    List.findOneAndUpdate(
      // find the list with page name
      {name:listName},
      // use $pull method to take out a piece of data
      {$pull:{items:{_id:checkedItemId}}},
      // callback to check for error
      (err,result)=>{
        if (err){
          return console.error(err);
        } else {
          // redirect back to the page if there is no error
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
// set up custom page request
app.get("/:pageName",(req,res)=>{
  // make custom page name capitalize
  const pageName= _.capitalize(req.params.pageName);
  // find list for the page
  List.findOne({name:pageName},(err, result)=>{
    // if there is no error
    if (!err){
      // if there is no result
      if (!result) {
        //  Create a new list
        const list= new List({
          name: pageName,
          items: defaultItems
        });
        // save to the database and check for error
          list.save((err)=> {if (err) return console.error(err)});
          // redirect to the page after saving
          res.redirect("/" + list.name);
      } else {
        //  show an existing list
        res.render("list", {listTitle: result.name, newListItems: result.items})
      }
    }
  });

});

app.listen(process.env.PORT || 3000,()=> console.log("Server started"));
