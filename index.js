require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();
app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// const User = mongoose.model("User", {
//   name: {
//     type: String,
//     default: ""
//   },
//   age: {
//     type: Number
//   }
// });

app.get("/", async (req, res) => {
  res.json({ message: "hello word" });
});

app.listen(process.env.PORT, () => {
  console.log("Server started");
});
