const pool = require("../models/database");
const bcrypt = require("bcrypt");
require("dotenv").config();
const { tokenGenerator } = require("../util/tokenGen");
const { password } = require("pg/lib/defaults");
const nodemailer = require("nodemailer");

module.exports = {
    // GET
    async getAllUsers(req, res) {
        try {
            if (req.user.data.role_id === 1 || req.user.data.role_id === 2) {
                const users = await pool.query(
                    "SELECT * FROM users ORDER BY user_id DESC"
                );
                return res.json(users.rows);
            } else {
                return res
                    .status(401)
                    .send({ message: "You are not authorize to view this page." });
            }
        } catch (error) {
            return res.status(500).send({ message: "Server error" });
        }
    },
    /* REGISTER */
    async register(req, res) {
        try {
            const { first_name, last_name, email, password } = req.body;

            /* Checking if email exist */
            const user = await pool.query("SELECT * FROM users WHERE email = $1", [
                email,
            ]);

            if (user.rows.length !== 0) {
                return res.status(401).send({ error: "Email already exist" });
            }

            /* Hashing password */
            const saltRound = 10;
            const salt = await bcrypt.genSalt(saltRound);
            const hashedPassword = await bcrypt.hash(password, salt);

            /* Insert into database */
            const newUser = await pool.query(
                "INSERT INTO users (first_name,last_name,email,password) VALUES ($1,$2,$3,$4) RETURNING *", [first_name, last_name, email, hashedPassword]
            );

            /* Generate jwt token */
            const token = tokenGenerator(newUser.rows[0].user_id);

            return res.status(201).send({ data: newUser.rows[0], token });
        } catch (error) {
            res.status(500).send({ error: "Server Error" });
        }
    },
    /* LOGIN */
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const user = await pool.query(
                "SELECT first_name, last_name, email, password, user_role.role_id, user_role.user_id FROM users INNER JOIN user_role ON users.user_id = user_role.user_id WHERE users.email = $1", [email]
            );

            /* check for user */
            if (!user.rows[0]) {
                return res
                    .status(401)
                    .send({ error: "Email or password is incorrect" });
            }
            const validPassword = await bcrypt.compare(
                password,
                user.rows[0].password
            );
            if (!validPassword) {
                return res.status(401).send({ error: "Incorrect Email or Password" });
            }
            /*  give the token */
            const token = tokenGenerator(user.rows[0]);
            return res.status(200).json({ data: user.rows[0], token });
        } catch (error) {
            res.status(500).send({ error: "Server Error" });
        }
    },
    async sendInvite(req, res) {
        //insert using inner join
        try {
            const { email, first_name, last_name, role_id, password } = req.body;
            const user = await pool.query("SELECT * FROM users WHERE email = $1", [
                email,
            ]);
            if (user.rows.length !== 0) {
                return res.status(401).send({ error: "Email already exist" });
            }
            console.log(req.body);
            const saltRound = 10;
            const salt = await bcrypt.genSalt(saltRound);
            const hashedPassword = await bcrypt.hash(password, salt);
            const newUser = await pool.query(
                "INSERT INTO users (first_name,last_name,email,password) VALUES ($1,$2,$3,$4) RETURNING *", [first_name, last_name, email, hashedPassword]
            );
            const newUserRole = await pool.query(
                "INSERT INTO user_role (user_id,role_id) VALUES ($1,$2) RETURNING *", [newUser.rows[0].user_id, 3]
            );


            let mailTransporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'akanwealth.asanga@gmail.com',
                    pass: process.env.MAIL_PASSWORD
                }
            });

            let mailDetails = {
                from: 'akan.asanga@gmail.com',
                to: email,
                subject: 'Club house invite',
                text: 'This is an invite to join clubhouse http://localhost:3000/api/users/login'
            };

            mailTransporter.sendMail(mailDetails, function(err, data) {
                if (err) {
                    console.log('Error Occurs');
                } else {
                    console.log('Email sent successfully');
                }
            });

            console.log(newUserRole.rows[0]);
            return res.status(201).send({ data: newUser.rows[0] });
        } catch (error) {
            console.log(error.message);
            res.status(500).send({ error: "Server Error" });
        }
    },
    //change user role to admin
    async changeRole(req, res) {
        try {
            const { user_id, role_id } = req.body;
            const user = await pool.query(
                "UPDATE user_role SET role_id = $1 WHERE user_id = $2", [role_id, user_id]
            );
            return res.status(200).send({ data: user.rows[0] });
        } catch (error) {
            res.status(500).send({ error: "Server Error" });
        }
    },
    //remove user from database and user_role table
    async removeUser(req, res) {
        try {
            const { user_id } = req.body;
            const user = await pool.query(
                "DELETE FROM users WHERE user_id = $1", [user_id]
            );
            const userRole = await pool.query(
                "DELETE FROM user_role WHERE user_id = $1", [user_id]
            );
            console.log(userRole.rows[0]);
            return res.status(200).send({ data: user.rows[0] });
        } catch (error) {
            res.status(500).send({ error: "Server Error" });
        }
    },
    //get all users and their roles
    async getAllUsersWithRole(req, res) {
        try {
            if (req.user.data.role_id === 1 || req.user.data.role_id === 2) {
                const users = await pool.query(
                    "SELECT users.user_id, users.first_name, users.last_name, users.email, user_role.role_id FROM users INNER JOIN user_role ON users.user_id = user_role.user_id"
                );
                return res.status(200).send({ data: users.rows });
            } else {
                return res.status(401).send({ error: "You are not authorized" });
            }
        } catch (error) {
            res.status(500).send({ error: "Server Error" });
        }
    },
    //get user by id and their roles 
    async getUserWithRole(req, res) {
        try {
            if (req.user.data.role_id === 1 || req.user.data.role_id === 2) {
                const { user_id } = req.params;
                const id = await pool.query(
                    "SELECT users.user_id, users.first_name, users.last_name, users.email, user_role.role_id FROM users INNER JOIN user_role ON users.user_id = user_role.user_id WHERE users.user_id = $1", [user_id]
                );
                return res.status(200).send({ data: id.rows });
            } else {
                return res.status(401).send({ error: "You are not authorized" });
            }
        } catch (error) {
            res.status(500).send({ error: "Server Error" });
        }
    }
};