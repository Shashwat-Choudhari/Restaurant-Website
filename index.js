import express from "express";
import bodyParser from "body-parser";
import cors from 'cors';
import dotenv from "dotenv";
import path from "path";
import { db } from "./config/db.js";
import { userRouter } from "./routes/user.js";
import { menuRouter } from "./routes/menu.js";
dotenv.config();


const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('uploads'));
app.use(cors());
app.use(express.json());

let cart = [];

db.connect((err) => {
    if (err) {
        console.log(err);
    }
    else
        console.log("Database connected");
});

app.get("/", (req, res) => {
    res.render("index.ejs");
});

app.use("/user", userRouter);
app.use("/menu", menuRouter);


app.post("/cart/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const result = await db.query("SELECT * FROM items JOIN images ON images.item_id = id WHERE id = $1", [id]);
        result.rows.forEach((item) => {
            cart.push(item);
        });
        try {
            const items = await allItems();
            res.render("menu.ejs", { items: items });
        } catch (error) {
            console.log(error);
        }
    } catch (error) {
        console.log(error);
    }
});

app.get("/cart", async (req, res) => {
    res.render("cart.ejs", { items: cart });
});

app.get("/remove/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const searchIndex = cart.findIndex((item) => item.id === id);
    if (searchIndex == -1) {
        res.sendStatus(400).json({ error: `Could not find Item with id ${id}` });
    }
    else {
        cart.splice(searchIndex, 1);
        res.render("cart.ejs", { items: cart });
    }
});

app.get("/order", async (req, res) => {
    for (var i = 0; i < cart.length; i++) {
        cart.pop();
    }
    res.render("cart.ejs", { message: "Order Placed" });
});

app.post("/review", async (req, res) => {
    const user = req.body.user;
    const review = req.body.review;
    try {
        await db.query("INSERT INTO reviews(user_name,review) VALUES($1,$2)", [user, review]);
        res.render("cart.ejs", { message: "Thank you for your Feedback." })
    } catch (error) {
        console.log(error);
    }
});

app.get("/reviews", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM reviews");
        let reviews = [];
        result.rows.forEach((review) => {
            reviews.push(review);
        });
        res.render("review.ejs", { reviews: reviews });
    } catch (error) {
        console.log(error);
    }
});

app.listen(port, () => {
    console.log("Listening on port " + port);
});