const mongoose = require("mongoose");
const Schema = require("mongoose").Schema;

const Offer = mongoose.model("Offer", {
  title: { type: String },
  description: { type: String },
  price: { type: Number },
  created: {
    type: Date,
    // `Date.now()` returns the current unix timestamp as a number
    default: Date.now
  },
  pictures: [],
  creator_id: Schema.Types.ObjectId
});
module.exports = Offer;
