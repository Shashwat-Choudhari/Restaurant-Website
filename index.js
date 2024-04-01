import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let cart = [];

const db = new pg.Pool({
    connectionString: process.env.POSTGRES_URL + "?sslmode=require",
});

db.connect((err)=>{
    if(err)
    {
        console.log(err);
    } 
    else   
    console.log("Connected to Postgres succesfully !!");
});

async function allItems()
{
    const result  = await db.query("SELECT * FROM items JOIN images ON images.item_id = id ORDER BY price");
    let items = [];
    console.log(result.rows);
    result.rows.forEach((item)=>{
        items.push(item);
    });
    return items;
}

app.get("/",(req,res)=>{
    res.render("index.ejs");
});

app.get("/menu",async (req,res)=>{
    try {
        const items = await allItems();
        res.render("menu.ejs",{items: items});
    } catch (error) {
        console.log(error);        
    }
});

app.post("/cart/:id",async (req,res)=>{
    const id = parseInt(req.params.id);
    try {
        const result = await db.query("SELECT * FROM items JOIN images ON images.item_id = id WHERE id = $1",[id]);
        result.rows.forEach((item)=>{
            cart.push(item);
        });
        try {
            const items = await allItems();
            res.render("menu.ejs",{items: items});
            alert("Item added to cart");
        } catch (error) {
            console.log(error);        
        }
    } catch (error) {
        console.log(error);
    }
});

app.get("/cart",async (req,res)=>{
    res.render("cart.ejs",{items: cart});
});

app.get("/remove/:id",async (req,res)=>{
    const id = parseInt(req.params.id);
    const searchIndex = cart.findIndex((item)=>item.id === id);
    if(searchIndex == -1)
    {
        res.sendStatus(400).json({error: `Could not find Item with id ${id}`});        
    }
    else
    {
        cart.splice(searchIndex,1);
        res.render("cart.ejs",{items:cart});
    }
});

app.get("/order",async (req,res)=>{
    for(var i =0;i<cart.length;i++)
    {
        cart.pop();
    }
    res.render("cart.ejs",{message: "Order Placed"});
});

app.post("/review",async(req,res)=>{
    const user = req.body.user;
    const review = req.body.review;
    try {
        await db.query("INSERT INTO reviews(user_name,review) VALUES($1,$2)",[user,review]);
        res.render("cart.ejs",{message: "Thank you for your Feedback."})
    } catch (error) {
        console.log(error);
    }    
});

app.get("/reviews", async(req,res)=>{
    try {
        const result = await db.query("SELECT * FROM reviews");
        let reviews = [];
        result.rows.forEach((review)=>{
            reviews.push(review);
        });
        res.render("review.ejs",{reviews: reviews});
    } catch (error) {
        console.log(error);        
    }
});

app.listen(port,()=>{
    console.log("Listening on port " + port);
});