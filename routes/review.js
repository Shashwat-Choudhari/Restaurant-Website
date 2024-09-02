import express from "express";
import { db } from "../config/db.js";
export const reviewRouter = express.Router();


reviewRouter.post("/add-review/:user_id", async (req, res) => {
    const user_id = parseInt(req.params.user_id);
    const review = req.body.review;
    try {
        const user = await db.query("SELECT * FROM users WHERE id = $1;", [user_id]);
        const username = user.rows[0].username;
        await db.query("INSERT INTO reviews(user_name, review) VALUES($1,$2)", [username, review]);
        
        res.render("cart.ejs", { message: "Thank you for your Feedback.", user_id: user.rows[0].id });
    } catch (error) {
        console.log(error);
    }
});

reviewRouter.get("/reviews/:user_id", async (req, res) => {
    const user_id = parseInt(req.params.user_id);
    try {
        const result = await db.query("SELECT * FROM reviews");
        let reviews = [];
        result.rows.forEach((review) => {
            reviews.push(review);
        });
        res.render("review.ejs", { reviews: reviews, user_id: user_id });
    } catch (error) {
        console.log(error);
    }
});