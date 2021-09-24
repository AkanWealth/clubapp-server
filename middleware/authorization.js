const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = async(req, res, next) => {
    const Token = req.headers["authorization"].split(" ")[1];
    if (!Token) {
        return res.status(403).json("Not Authorize");
    }
    jwt.verify(Token, process.env.SECRET, (err, data) => {
        if (err) {
            return res.status(403).json("Not Authorize");
        }
        req.user = data;
        next();
    })
};