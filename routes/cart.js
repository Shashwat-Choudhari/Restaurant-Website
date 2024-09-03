import express from "express";
import { db } from "../config/db.js";
export const cartRouter = express.Router();

cartRouter.post("/add-to-cart/:id/:user_id", async (req, res) => {
    const id = parseInt(req.params.id);
    const user_id = parseInt(req.params.user_id);
    
    try {
        // Check if the user's cart exists
        const currentCart = await db.query("SELECT * FROM carts WHERE user_id = $1;", [user_id]);

        let cart_id;

        // If the cart does not exist, create a new one
        if (currentCart.rowCount === 0) {
            const addCart = await db.query("INSERT INTO carts(user_id) VALUES($1) RETURNING *;", [user_id]);
            cart_id = addCart.rows[0].id; // Correctly access cart_id
        } else {
            cart_id = currentCart.rows[0].id; // Use existing cart_id
        }

        // Check if the item is already in the cart
        const itemResult = await db.query(`
            SELECT quantity FROM cart_items WHERE cart_id = $1 AND items_id = $2;
        `, [cart_id, id]);

        if (itemResult.rowCount === 0) {
            // Insert the item into cart_items
            await db.query("INSERT INTO cart_items(cart_id, items_id, quantity) VALUES($1, $2, $3);", [cart_id, id, 1]);
        } else {
            // Update the quantity if the item already exists
            const newQuantity = itemResult.rows[0].quantity + 1;
            await db.query("UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND items_id = $3;", [newQuantity, cart_id, id]);
        }

        // Fetch and render updated items from the menu
        const result = await db.query("SELECT * FROM items i JOIN item_images ii ON ii.item_id = i.id ORDER BY price");
        const items = result.rows;

        res.render("menu.ejs", { items: items , user_id: user_id});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while adding to the cart." });
    }
});


cartRouter.get("/go-to-cart/:user_id", async (req, res) => {
    const user_id = parseInt(req.params.user_id);
    try {
        // Check if the user's cart exists
        const result = await db.query("SELECT * FROM carts WHERE user_id = $1;", [user_id]);

        let cart_id;

        // If the cart does not exist, create a new one
        if (result.rows.length === 0) {
            const newCart = await db.query("INSERT INTO carts(user_id) VALUES($1) RETURNING *;", [user_id]);
            cart_id = newCart.rows[0].id; // Get the new cart's ID
            return res.render("cart.ejs", { items: [], user_id: user_id }); // Return empty cart
        } else {
            cart_id = result.rows[0].id; // Access cart ID from the result
        }

        // Fetch current cart items
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
            ci.cart_id = $1;
        `, [cart_id]);
        // Prepare items array
        let cart_items = []; // Use the rows directly as the items array
        cart.rows.forEach((row)=>{
            cart_items.push(row);
        });
        console.log(cart_items);
        // Render the cart view with items
        // Log the items to ensure they are fetched correctly
        res.render("cart.ejs", { items: cart_items, user_id: user_id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while fetching the cart." });
    }
});



cartRouter.get("/remove/:id/:user_id", async (req, res) => { // Change method to DELETE
    const itemId = parseInt(req.params.id);
    const userId = parseInt(req.params.user_id);

    try {
        // Check if the user's cart exists
        const cartResult = await db.query("SELECT * FROM carts WHERE user_id = $1;", [userId]);
        if (cartResult.rowCount === 0) {
            return res.status(400).json({ error: `No cart found for user with id ${userId}` });
        }

        const cartId = cartResult.rows[0].id;

        const itemResult = await db.query("SELECT * FROM cart_items WHERE cart_id = $1 AND items_id = $2;", [cartId, itemId]);
        if (itemResult.rowCount === 0) {
            return res.status(400).json({ error: `Could not find item with id ${itemId} in the cart` });
        }

        // Remove the item from the cart
        const currentQuantity = itemResult.rows[0].quantity;

        if (currentQuantity > 1) {
            // Decrease the quantity by 1
            await db.query("UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND items_id = $3;", [currentQuantity - 1, cartId, itemId]);
        } else {
            // Remove the item if quantity is 1
            await db.query("DELETE FROM cart_items WHERE cart_id = $1 AND items_id = $2;", [cartId, itemId]);
        }

        // Fetch the updated cart items
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
            ci.cart_id = $1;
        `, [cartId]);
        // Prepare items array
        let cart_items = []; // Use the rows directly as the items array
        cart.rows.forEach((row)=>{
            cart_items.push(row);
        });

        // Render the cart view with updated items
        res.render("cart.ejs", { items: cart_items, user_id: userId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while removing the item from the cart." });
    }
});



