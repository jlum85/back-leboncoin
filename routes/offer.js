const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Offer = require("../models/Offer");
const cloudinary = require("cloudinary").v2;

// Configurer Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

router.post("/offer/publish", async (req, res) => {
  console.log("/offer/publish");
  console.log(req.fields);
  console.log(req.files);
  const { title, description, price } = req.fields;

  const authorizationHeader = req.headers.authorization;
  let token = "";
  if (authorizationHeader) {
    token = authorizationHeader.split(" ")[1]; // Bearer <token>
  }

  if (!token) {
    res.status(400).json({ message: "Unauthorized" });
    return;
  }

  const user = await User.findOne({ token: token });
  if (!user) {
    res.status(400).json({ message: "Unauthorized" });
    return;
  }

  const files = Object.keys(req.files);
  if (files.length) {
    const results = {};
    // on parcourt les fichiers
    files.forEach(fileKey => {
      // on utilise les path de chaque fichier (la localisation temporaire du fichier sur le serveur)
      cloudinary.uploader.upload(
        req.files[fileKey].path,
        {
          // on peut préciser un dossier dans lequel stocker l'image
          folder: "leboncoin"
        },
        async (error, result) => {
          // on enregistre le résultat dans un objet
          if (error) {
            results[fileKey] = {
              success: false,
              error: error
            };
          } else {
            results[fileKey] = {
              success: true,
              result: result
            };
          }
          if (Object.keys(results).length === files.length) {
            console.log("end cloudinary");
            console.log(results);
            // tous les uploads sont terminés, on peut donc envoyer la réponse au client
            try {
              const newOffer = new Offer({
                title: title,
                description: description,
                price: price,
                token: token,
                pictures: [],
                creator_id: user._id
              });
              //newOffer.pictures.push(result.secure_url);

              await newOffer.save();
              console.log(newOffer);

              res.json({
                _id: newOffer._id,
                title: newOffer.title,
                description: newOffer.description,
                price: newOffer.price,
                // pictures: newOffer.pictures,
                creator: {
                  account: {
                    username: user.account.username
                  },
                  _id: user.creator_id
                }
              });
            } catch (error) {
              res.status(400).json({ message: error.message });
            }
          }
        }
      );
    });
  }
});

module.exports = router;
