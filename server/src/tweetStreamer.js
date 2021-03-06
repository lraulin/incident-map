#!/usr/bin/env node

const Twitter = require("twitter");
const incidentTypes = require("./incidentTypes.js");
const findLocation = require("./findLocationModule.js");
const { twitterConfig } = require("./secrets.js");

module.exports.tweetStreamer = postgresModule => {
  const categorize = tweet => {
    if (!tweet.id_str) {
      throw new TypeError("Not a Tweet!");
    }
    const types = [];
    Object.keys(incidentTypes).forEach(typeKey => {
      const re = incidentTypes[typeKey].regex;
      if (tweet.text.match(re)) {
        types.push(typeKey);
      }
    });
    tweet.incidentType = types;
    return tweet;
  };

  const processTweetStream = async data => {
    if (data.id_str) {
      if (data.user.verified === false) {
        console.log("User not verified...discarding Tweet.");
        return;
      }
      if (data.retweeted_status) {
        console.log("Tweet is a retweet...discarding.");
        return;
      }
      categorize(data);
      data = await findLocation(data);
      if (!data.coordinates) {
        if (data.user && data.user.location) {
          console.log(
            `Geocoding for ${data.user.location} failed. Discarding Tweet.`
          );
        } else {
          console.log("Geolocation failed. Discarding Tweet.");
        }
        return;
      }
      postgresModule.saveTweet(data);
    }
  };

  const twitterClient = new Twitter(twitterConfig);
  const searchString =
    "fatal crash,fatal car crash,fatal car accident,pedestrian killed,fatal truck accident,fatal truck crash,truck kill,bus kill,cyclist killed,bicyclist killed,pedestrian crash,pedestrian killed,bicyclist crash,bicyclist killed,cyclist crash,cyclist killed,truck crash,truck kill,fatal truck crash,fatal truck accident,bus crash,bus kill,transit crash,transit crash,transit kill,rail suicide,transit suicide,pipeline explosion,pipeline spills,hazardous spill,hazardous spills,train explosion,train explode,bike lane blocked,bus lane blocked,road closed,road closure,road flooded,road washed,bridge closed,bridge out,ran red light,blew red light,blew through red light,drone unauthorized";

  const stream = twitterClient.stream("statuses/filter", {
    track: searchString
  });

  stream.on("data", event => {
    console.log(event && event.text);
    if (event.id_str) processTweetStream(event);
  });

  stream.on("error", error => {
    throw error;
  });
};
