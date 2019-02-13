const express = require("express");
const app = express();
const postgres = require("./postgres/postgresModule.js");
const { tweetStreamer } = require("./tweetStream.js");

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
