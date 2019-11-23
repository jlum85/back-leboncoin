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
  if (files.length > 0) {
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
              newOffer.pictures.push(result.secure_url);
              await newOffer.save();
              console.log(newOffer);

              res.json({
                _id: newOffer._id,
                title: newOffer.title,
                description: newOffer.description,
                price: newOffer.price,
                pictures: newOffer.pictures,
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
  } else {
    try {
      const newOffer = new Offer({
        title: title,
        description: description,
        price: price,
        token: token,
        pictures: [],
        creator_id: user._id
      });
      await newOffer.save();

      res.json({
        _id: newOffer._id,
        title: newOffer.title,
        description: newOffer.description,
        price: newOffer.price,
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
});

// http://localhost:4000/offer/with-count?title=cd&sort=price-asc&skip=0&limit=5
router.get("/offer/with-count", async (req, res) => {
  console.log("/offer/with_count");
  console.log(req.query);
  const ObjSort = {};
  const pTitle = req.query.title;
  const priceMin = req.query.priceMin;
  const priceMax = req.query.priceMax;
  const pSort = req.query.sort;
  const pSkip = req.query.skip;
  const pLimit = req.query.limit;

  if (pTitle) {
    ObjSort.title = new RegExp(pTitle, "i"); // insensible à la casse
  }
  if (priceMin) {
    ObjSort.price = {}; // { $gt: " + priceMin + " }";
    ObjSort.price["$gt"] = priceMin;
  }
  if (priceMax) {
    if (!ObjSort.price) {
      ObjSort.price = {};
    }
    ObjSort.price["$lt"] = priceMax;
  }

  const search = Offer.find(ObjSort);
  if (pSort === "price-asc") {
    search.sort({ price: 1 });
  } else if (pSort === "price-desc") {
    search.sort({ price: -1 });
  } else if (pSort === "date-asc") {
    search.sort({ created: 1 });
  } else if (pSort === "date-desc") {
    search.sort({ created: -1 });
  }

  if (pLimit) {
    search.limit(Number(pLimit));
    search.skip(Number(pSkip));
  }

  const elems = await search;
  // console.log(elems);
  const newObj = { count: elems.length, offers: elems };
  console.log(newObj);

  res.json(newObj);
});

// "http://localhost:3000/offer/" + id
router.get("/offer/:id", async (req, res) => {
  console.log("/offer/id");

  const id = req.params.id;
  console.log(id);
  if (id) {
    const offer = await Offer.findById(id);
    if (offer) {
      console.log(offer);

      const user = await User.findById(offer.creator_id);
      if (user) {
        res.json({
          _id: offer._id,
          pictures: offer.pictures,
          description: offer.description,
          price: offer.price,
          creator: {
            account: {
              username: user.account.username
            },
            _id: offer.creator_id
          },
          created: offer.created
        });
      } else {
        res.json(offer);
      }
    } else {
      return res.status(401).json({ error: "Offer not exist" });
    }
  } else {
    return res.status(401).json({ error: "Unauthorized" });
  }
});

module.exports = router;
