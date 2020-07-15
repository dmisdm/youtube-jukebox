const express = require("express");
const app = express();
const server = require("http").createServer(app);
const Gun = require("gun");
const yts = require("yt-search");

const gun = Gun({
  web: server,
});

app.get("/search", (req, res, next) => {
  yts(req.query, (err, results) => {
    if (err) {
      next(err);
    } else {
      res.json(results);
    }
  });
});

module.exports = { gun, server };
