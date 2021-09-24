const jwt = require("jsonwebtoken");
require("dotenv").config();

function tokenGenerator(data) {
    const token = jwt.sign({ data }, process.env.SECRET, { expiresIn: "1h" });
    return token;

    // const token = jwt.sign({ user_id }, process.env.SECRET, { expiresIn: "1h" });


    // return jwt.sign(payload, process.env.SECRET, {
    //     expiresIn: "1hr",
    // });
}

module.exports = { tokenGenerator };