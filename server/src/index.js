const express = require("express");
const { postgres } = require("./postgres.js");
const { tweetStreamer } = require("./tweetStreamer.js");

const app = express();
console.log("Attempting to start server...");

// Start streaming Tweets.
tweetStreamer(postgres);

app.listen(3050, () => {
  console.log("Server running on port 3050");
});

app.get("/tweets", async (req, res, next) => {
  const data = await postgres.fetch();
  res.json(data);
});
