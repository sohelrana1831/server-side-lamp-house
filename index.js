const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();
const ObjectId = require("mongodb").ObjectId;

// middleware
app.use(cors());
// app.use(express());
app.use(express.json());

// mongoDb connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.esrwv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    console.log("MongoDb Connection success!");
    const database = client.db("lampHouseDB");

    const usersCollection = database.collection("users");
    const productsCollection = database.collection("products");
    const ordersCollection = database.collection("orders");
    const reviewsCollection = database.collection("reviews");

    /*=========================================   
    =================  User ===================    
    ===========================================*/

    // Register user
    app.post("/user", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      console.log(user);
      let isAdmin = false;
      if (user?.role) {
        isAdmin = true;
      }
      res.send({ admin: isAdmin });
    });

    //  PUT data form google or gmail
    app.put("/user", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // Make admin (Only admin can make a new admin)
    app.put("/user/admin", async (req, res) => {
      const user = req.body;
      const requester = user.requesterEmail;
      if (requester) {
        const requesterAccount = await usersCollection.findOne({
          email: requester,
        });
        if (requesterAccount.role === "admin") {
          const filter = { email: user.email };
          const updateDoc = { $set: { role: "admin" } };
          const result = await usersCollection.updateOne(filter, updateDoc);
          res.send(result);
        } else {
          res.status(403).json({ message: "Do not have access make admin" });
        }
      }
    });

    /*=========================================   
    =================  Product ================   
    ===========================================*/

    // GET API, get all active product
    app.get("/active-product", async (req, res) => {
      const cursor = productsCollection.find({ status: "active" });
      const result = await cursor.toArray(cursor);
      res.send(result);
    });

    app.post("/add-product", async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });

    // GET API, get all Product
    app.get("/manage-product", async (req, res) => {
      const cursor = productsCollection.find({});
      const result = await cursor.toArray(cursor);
      res.send(result);
    });

    // Delete API, Delete products
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.json(result);
    });

    // PUT API, change product status
    app.put("/update-product-status/:id", async (req, res) => {
      const id = req.params.id;
      const statusUpdate = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };

      // create a document that sets the plot of the movie
      const updateDoc = {
        $set: {
          status: statusUpdate.status,
        },
      };
      const result = await productsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      const cursor = productsCollection.find({});
      const getResult = await cursor.toArray(cursor);
      res.send(getResult);
    });

    // GET API, get by product id
    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });

    // PUT API, Update by ID
    app.put("/update-product/:id", async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;
      console.log(updateData);
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };

      // create a document that sets the plot of the movie
      const updateDoc = {
        $set: {
          title: updateData.title,
          image_url: updateData.image_url,
          price: updateData.price,
          description: updateData.description,
        },
      };
      const result = await productsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    /*=========================================   
    =================  Product Order ================   
    ===========================================*/
    // Order a product
    app.post("/order", async (req, res) => {
      const product = req.body;
      const result = await ordersCollection.insertOne(product);
      res.send(result);
    });

    // GET API, get all Product Order
    app.get("/manage-order", async (req, res) => {
      const cursor = ordersCollection.find({});
      const result = await cursor.toArray(cursor);
      res.send(result);
    });

    // Delete API, Delete Order
    app.delete("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await ordersCollection.deleteOne(query);
      res.json(result);
    });

    // PUT API, change order status
    app.put("/update-order-status/:id", async (req, res) => {
      const id = req.params.id;
      const statusUpdate = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };

      // create a document that sets the plot of the movie
      const updateDoc = {
        $set: {
          status: statusUpdate.status,
        },
      };
      const result = await ordersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      const cursor = ordersCollection.find({});
      const getResult = await cursor.toArray(cursor);
      res.send(getResult);
    });

    // order by User
    app.get("/customer-order", async (req, res) => {
      const email = req.query.email;
      const query = { email };
      const cursor = ordersCollection.find(query);
      const result = await cursor.toArray();
      res.json(result);
    });
    /*=========================================   
    =================  Review ================   
    ===========================================*/
    // POST Review
    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });

    // GET API, get Review by user
    app.get("/customer-review", async (req, res) => {
      const email = req.query.email;
      const query = { email };
      const cursor = reviewsCollection.find(query);
      const result = await cursor.toArray();
      res.json(result);
    });

    // Delete API, Delete review
    app.delete("/review/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewsCollection.deleteOne(query);
      res.json(result);
    });

    // GET API, get all review
    app.get("/all-review", async (req, res) => {
      const cursor = reviewsCollection.find({});
      const result = await cursor.toArray(cursor);
      res.send(result);
    });
  } finally {
    //   await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server run for Lamp House!");
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
