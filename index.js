import express from "express";
import bodyParser from "body-parser";
import cors from 'cors';
import dotenv from "dotenv";
import path from "path";
import { db } from "./config/db.js";
import { userRouter } from "./routes/user.js";
import { menuRouter } from "./routes/menu.js";
import { cartRouter } from "./routes/cart.js";
import { orderRouter } from "./routes/order.js";
import { reviewRouter } from "./routes/review.js";
dotenv.config();


const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('uploads'));
app.use(cors());
app.use(express.json());

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
app.use("/cart", cartRouter);
app.use("/order", orderRouter);
app.use("/review", reviewRouter);


app.listen(port, () => {
    console.log("Listening on port " + port);
});