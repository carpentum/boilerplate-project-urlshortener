require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const dns = require("dns");
const url = require("url").URL;
let mongoose = require("mongoose");
let bodyParser = require("body-parser");

mongoose
  .connect(
    `mongodb+srv://ramonmosquera:${process.env.MONGO_PASSWORD}@cluster0.fcwmg46.mongodb.net/shorturl`
  )
  .catch((error) => {
    console.log(error);
  });

let shortUrlSchema = new mongoose.Schema({
  original_url: {
    required: true,
    type: String,
  },
  short_url: String,
});

let ShortUrl = mongoose.model("ShortUrl", shortUrlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.post(
  "/api/shorturl/",
  bodyParser.urlencoded({ extended: false }),
  async (req, res) => {
    let shortUrl = 1;
    let inputUrl = req.body.url;

    let urlRegex = new RegExp(
      /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi
    );

    if (!inputUrl.match(urlRegex)) {
      return res.status(200).json({ error: "invalid url" });
    }
    // if (stringIsAValidUrl(inputUrl)) {
    const highestShortDoc = await findHighestShort();
    if (highestShortDoc.length === 1) {
      shortUrl = parseInt(highestShortDoc[0].short_url) + 1;
    }
    const urlObject = await findShortUrlByUrl(inputUrl);
    if (!urlObject) {
      const newDoc = new ShortUrl({
        original_url: inputUrl,
        short_url: shortUrl,
      });
      const newShortUrl = await newDoc.save();
      return res.status(200).json(newShortUrl);
    }
    res.status(200).json(urlObject);
  }
);

app.get("/api/shorturl/:inputShortUrl", async (request, response) => {
  let destinyUrl = request.params.inputShortUrl;
  let urlObject = await findShorturlByShorturl(destinyUrl);
  if (urlObject) {
    response.status(302).setHeader("location", urlObject.original_url).end();
  }
});

const stringIsAValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
};

function findHighestShort() {
  try {
    return ShortUrl.find().sort({ short_url: -1 }).limit(1);
  } catch (error) {
    console.log(error);
  }
}

function findShortUrlByUrl(inputUrl) {
  try {
    return ShortUrl.findOne({ original_url: inputUrl });
  } catch (error) {
    console.log(error);
  }
}

const findShorturlByShorturl = (shortUrl) => {
  try {
    return ShortUrl.findOne({ short_url: shortUrl });
  } catch (error) {
    console.log(error);
  }
};

app.get("/", function (req, res) {
  res.status(200).sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.status(200).json({ greeting: "hello API" });
});

// Your first API endpoint
app.get("/api/shorturl", function (req, res) {
  dns.lookup("freeCodeCamp.org", (err, address) => {
    console.log(address);
    res.status(200).json({ original_url: address, short_url: "1" });
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
