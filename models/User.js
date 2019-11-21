const mongoose = require("mongoose");

const User = mongoose.model("User", {
  mail: String,
  salt: String,
  hash: String,
  token: String,
  account: {
    username: String
  }
});
module.exports = User;
