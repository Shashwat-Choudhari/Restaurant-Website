// import { Authentication } from "../middleware/pw_authorization.js";
// import { Auth } from "../middleware/auth.js";
import express from "express";
import {db} from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
export const userRouter = express.Router();


userRouter.get("/login", (req, res) => {
    res.render("login.ejs");
});

userRouter.get("/register", (req, res) => {
    res.render("register.ejs");
});

userRouter.post("/register", async (req, res) => {
    const email = req.body.email;
    const userName = req.body.username;
    const password = req.body.password;
    const phone = req.body.phone;

    try {
        const existUserResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existUserResult.rows.length > 0) {
            return res.status(400).render("register.ejs", { msg: "Email already exists", status: false });
        }
        const isExistUserNameResult = await db.query('SELECT * FROM users WHERE username = $1', [userName]);
        if (isExistUserNameResult.rows.length > 0) {
            return res.status(400).render("register.ejs", { msg: "User name exists", status: false });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const insertUserQuery = `
            INSERT INTO users (email, password, phone, username) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id,email, phone, username, role;
        `;
        const insertUserValues = [email, hashedPassword, phone, userName];
        const newUserResult = await db.query(insertUserQuery, insertUserValues);

        const newUser = newUserResult.rows[0];

        if(newUser){
            res.status(200).render("login.ejs", {msg: "User registered succesfully"});
        }
    } catch (err) {
        console.log(err);
    }
});

userRouter.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).render("login.ejs", { msg: "Email and Password are required", status: false });
        }


        try {
            const existUserResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            const existUser = existUserResult.rows[0];

            if (!existUser) {
                return res.status(400).render("login.ejs" ,{ msg: "Email is incorrect", status: false });
            }

            const checkPassword = await bcrypt.compare(password, existUser.password);

            if (checkPassword === false) {
                return res.status(400).render("login.ejs",{ msg: "Email or Password are incorrect", status: false });
            }

            const token = jwt.sign(
                { id: existUser.id },
                process.env.JWT_SECRET,
                { expiresIn: Number(process.env.JWT_TIME) }
            );

            await db.query('UPDATE users SET accesstoken = $1 WHERE id = $2', [token, existUser.id]);
            try {
                const result = await db.query("SELECT * FROM items i JOIN item_images ii ON ii.item_id = i.id ORDER BY price");
                let items = [];
                console.log(result.rows);
                result.rows.forEach((item) => {
                    items.push(item);
                });
                res.status(200).render("menu.ejs",{items: items , user_id : existUser.id});
            } catch (error) {
                console.log(error);
            }

        } catch (err) {
            console.log(err);
        }
    } catch (err) {
        console.log(err);
    }
});