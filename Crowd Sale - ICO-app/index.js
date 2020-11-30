var express = require('express');
var app = express();
var favicon = require('serve-favicon');
const path = require('path')
app.use(express.static('src'));
app.use(favicon(path.join(__dirname, 'src', 'img','favicon.ico')))
// app.use(express.static('src'));
app.use(express.static('../Crowd Sale - ICO-contract/build/contracts'));

app.get('/', function (req, res) {
  res.render('index.html');
});

app.listen(3000, function () {
  console.log('Auction Dapp listening on port 3000!');
});