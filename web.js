var express = require("express");
var morgan = require("morgan")
var app = express();
app.use(morgan('combined'));
app.use("/", express.static(__dirname));

var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on " + port);
});
