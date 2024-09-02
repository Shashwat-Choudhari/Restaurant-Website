import express from "express";
import { db } from "../config/db.js";
import { upload } from "../config/image-upload.js";
import formidable from "formidable";
export const menuRouter = express.Router();
import fs from "fs";

menuRouter.get("/get-all-items/:user_id", async (req, res) => {
    const user_id = parseInt(req.params.user_id);
    try {
        const result = await db.query("SELECT * FROM items i JOIN item_images ii ON ii.item_id = i.id ORDER BY price");
        let items = [];
        result.rows.forEach((item) => {
            items.push(item);
        });
        res.render("menu.ejs", { items: items, user_id: user_id });
    } catch (error) {
        console.log(error);
    }
});

menuRouter.post('/add-item', upload.single("item_image"), async (req, res) => {
    try {
        const { item, price, rating } = req.body;

        const checkItem = await db.query('SELECT * FROM items WHERE item = $1', [item]);
        if (checkItem.rows.length > 0) {
            return res.status(400).json({ msg: 'Item already present' });
        }

        if (!req.file) {
            return res.status(400).json({ msg: 'Please upload an image of the item' });
        }
        const imageFile = req.file;
        const filename = imageFile.filename;
        const filepath = imageFile.path;
        const mimeType = imageFile.mimetype;


        const result = await db.query(
            'INSERT INTO items (item, price, rating) VALUES ($1, $2, $3) RETURNING id;',
            [item, price, rating]
        );

        if (result.rows.length > 0) {
            const itemId = result.rows[0].id;
            const imageUpload = await db.query(
                'INSERT INTO item_images (item_id, filename, filepath, mimetype) VALUES ($1, $2, $3, $4);',
                [itemId, filename, filepath, mimeType]
            );

            if (imageUpload.rowCount > 0) {
                return res.status(200).json({ msg: 'Item added successfully' });
            } else {
                return res.status(500).json({ msg: 'Error in image uploading' });
            }
        } else {
            return res.status(500).json({ msg: 'Something went wrong! Please try again' });
        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ msg: 'Internal server error' });
    }
});