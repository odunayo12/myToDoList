//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
// const date = require(__dirname + "/date.js");
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// Database

mongoose.connect('mongodb+srv://admin-odun:test123@cluster0-chv5a.mongodb.net/todolistDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});


const itemSchema = new mongoose.Schema({
  name: String
});


const Item = mongoose.model('Item', itemSchema);

const item1 = new Item({
  name: "Buy Food"
});

const item2 = new Item({
  name: "Cook Food"
});

const item3 = new Item({
  name: "Eat Food"
});

const defaultItems = [item1, item2, item3];

// our datamodel embedds the items collection
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});

const List = mongoose.model('List', listSchema);


// item.save();
// Item.insertMany(defaultItems, (err) => {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log('Success!');
//   }
// });

// defaultItems.forEach((item) => {
//   console.log(item.name);
// });

// this is mongoDB style
// Item.find((err, iName) => {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log(iName);
//     iName.forEach((item) => {
//       console.log(item.name);
//       // console.log('Success!');
//     });
//
//
//   }
// })
//

// deleteMany
// Item.deleteMany({
//     _id: {
//       $in: ["5e85bb5c15e0505728de4fb7",
//         "5e85bb5e643c2c3cc4d31b60"
//       ]
//     }
//   },
//   (err) => {
//     if (err) {
//       console.log(err);
//     } else {
//       console.log('Success!');
//     }
//
// })



app.get("/", function(req, res) {

  // const day = date.getDate();
  // foundItems recieves the items found as result
  Item.find({}, (err, foundItems) => {
    // if our Database happen to be empty we push in some values as default
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log('Success!');
        }
      });
      // this renders the item added if empty
      res.redirect('/');
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
});

app.post("/", function(req, res) {
  // this collects input from the form named newItem and the following saves it to the DB
  const itemName = req.body.newItem;
  const listName = req.body.list

  const item = new Item({
    name: itemName
  });
  // if we are in the default todo list
  if (listName === "Today") {
    // we use this instead of the long insertMany  line
    item.save();
    // to get what was entered to appear on our home route, just redirect the post to the same route
    res.redirect('/');
  } else {
    // updates the array associated with the newly created custom TO-DO list (see schema)
    List.findOne({
      name: listName
    }, (err, foundOutput) => {
      // items here is the one defined in the Schema
      foundOutput.items.push(item);
      //saves the newly added todo element in the List collection
      foundOutput.save();
      // THE redirect IS POSSIBLE BECAUSE WE HAVE FIRST CREATED A PARAMATIZED ROUTE name
      // WHICH ENABLES US TO CREATE CUSTOM LIST and is handled by the next chunk of code
      res.redirect('/' + listName);
    })
  }
});

app.get('/:customListName', (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
    // entry found will return an object since we use findOne
  }, (err, entryFound) => {
    if (!err) {
      // ! = does not exist.
      if (!entryFound) {
        // console.log("Does not exist");
        // create a new list
        // in the ffg we set any created list (which is also a route name) to the new entry in a collection having a default value ofour already defined items collection
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect('/' + customListName);
      } else {
        // console.log("Exists!");
        // show an existing list
        // recall list is a template file in views folder;
        res.render("list", {
          // tap into entry entryFound
          listTitle: entryFound.name,
          newListItems: entryFound.items
        });
      }
    }
  });
});



app.post('/delete', (req, res) => {
  // the following obtains the value from the post request made by clicking an item in the list
  const itemToDelete = req.body.checkToDelete;
  const hiddenListName = req.body.hiddenListName;
  // if we are in the default todo list
  if (hiddenListName === "Today") {
    Item.findByIdAndRemove(itemToDelete, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log(itemToDelete + " deleted");
        res.redirect('/');
      }
    });
  } else {
    List.findOneAndUpdate({ name: hiddenListName }, { $pull: { items: { _id: itemToDelete } } }, (err, foundUpdates) => {
      if (!err) {
        res.redirect("/" + hiddenListName)
      }
    })
  }

})



app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

// admin_UP
//admin-odun
// test123