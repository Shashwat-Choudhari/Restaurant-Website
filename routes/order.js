import express from "express";
import { db } from "../config/db.js";
export const orderRouter = express.Router();

orderRouter.post("/cart-to-order/:cart_id/:user_id", async (req, res) => {
    const cart_id = parseInt(req.params.cart_id);
    const user_id = parseInt(req.params.user_id);
    try {
        const cart = await db.query(`
            SELECT 
                ci.id AS cart_item_id, 
                ci.quantity AS quantity,        
                i.id AS item_id,               
                i.item AS item,           
                i.price AS price,  
                i.rating AS rating,       
                ii.filename AS filename,     
                c.user_id, 
                c.id AS cart_id                      
            FROM 
                cart_items ci
            JOIN 
                items i ON ci.items_id = i.id
            JOIN 
                item_images ii ON i.id = ii.item_id
            JOIN 
                carts c ON ci.cart_id = c.id
            WHERE 
                c.id = $1;
        `, [cart_id]);

        const cartDetails = cart.rows;

        // Create orders
        const orderPromises = cartDetails.map(async (prod) => {
            const { item_id, user_id, price, quantity } = prod;
            const sell_price = price * quantity; // Calculate the total price

            const orderQuery = `
                INSERT INTO orders (
                    item_id, user_id, sell_price, created_at
                ) VALUES ($1, $2, $3, NOW())
                RETURNING *;
            `;
            const orderValues = [item_id, user_id, sell_price];
            const orderResult = await db.query(orderQuery, orderValues);
            return orderResult.rows[0];
        });

        const orders = await Promise.all(orderPromises);
        await db.query("DELETE FROM cart_items WHERE cart_id = $1", [cart_id]);

        res.render("cart.ejs", { message: "Order Placed", user_id: user_id});
    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).render("cart.ejs", { message: "Error placing order" });
    }
});