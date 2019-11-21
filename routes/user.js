const express = require("express");
const router = express.Router();
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

const User = require("../models/User"); // il faut remettre tous les models pour l’initialisation

router.post("/user/sign_up", async (req, res) => {
  console.log("/user/sign_up");
  if (req.fields) {
    console.log(req.fields);
    const { email, username, password } = req.fields;

    // contrôles des paramètres reçus
    if (!email) {
      res.status(400).json({ message: "Error Missing Parameter [email]" });
      return;
    }
    if (!username) {
      res.status(400).json({ message: "Error Missing Parameter [username]" });
      return;
    }
    if (!password) {
      res.status(400).json({ message: "Error Missing Parameter [password]" });
      return;
    }

    // le mail est la clé donc on vérifie que le mail n'existe pas
    const user = await User.findOne({ mail: email });
    console.log(user);
    if (user) {
      res.status(400).json({
        message: "Error User already exist",
        userMsg: "Ce compte existe déjà"
      });
      return;
    }

    const token = uid2(64);
    const salt = uid2(64);
    const hash = SHA256(password + salt).toString(encBase64);

    try {
      const newUser = new User({
        mail: email,
        salt: salt,
        hash: hash,
        token: token,
        account: { username: username }
      });

      await newUser.save();
      res.json({
        token: newUser.token,
        account: newUser.account,
        _id: newUser._id
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  } else {
    res.status(400).json({ message: "Error formData Empty" });
  }
});

router.post("/user/sign_in", async (req, res) => {
  console.log("/user/sign_in");
  console.log(req.fields);
  const { email, password } = req.fields;

  const user = await User.findOne({ mail: email });
  if (user) {
    const hash = SHA256(password + user.salt).toString(encBase64);
    if (hash === user.hash) {
      res.json({
        _id: user._id,
        token: user.token,
        account: user.account
      });
    } else {
      return res.status(401).json({ error: "Unauthorized" });
    }
  } else {
    res.status(400).json({ message: "Unauthorized" });
  }
});
module.exports = router;
