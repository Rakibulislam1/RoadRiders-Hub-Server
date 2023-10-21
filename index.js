const express = require ('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.v6vphhi.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    const productCollection =  client.db('productDB').collection('product');
    
    const users = client.db("productDB").collection("users");

    app.post("/create-user", async (req, res) => {
      const { email } = req.body;
      const cursor = users.find();
      const result = await cursor.toArray();
      const foundUser = result.filter((user) => user.email === email);
      if (foundUser.length) {
        console.log("already added");
        return res.send("already added");
      }
      const user = await users.insertOne({ email, cart: [] });
      res.end();
    });

    app.post("/request-cart", async (req, res) => {
      const { email } = req.body;
      const cursor = users.find();
      const result = await cursor.toArray();
      const foundUser = result.filter((user) => user.email === email);
      res.json(foundUser[0].cart);

      res.end();
    });

    app.delete("/delete-cart-item", async (req, res) => {
      const id = req.body.id;
      const email = req.body.email;

      const cursor = users.find();
      const result = await cursor.toArray();
      const foundUser = result.filter((user) => user.email === email);

      const allCart = [...foundUser[0].cart];

      const updatedCart = allCart.filter((item) => item.id !== id);

      await users.updateOne(
        { email: email },
        { $set: { cart: updatedCart } },
        { upsert: true }
      );
      console.log(updatedCart);

      res.end();
    });

    app.put("/add-to-cart", async (req, res) => {
      const data = req.body;
      const cursor = users.find();
      const result = await cursor.toArray();
      const foundUser = result.filter((user) => user.email === data.email);
      const newProduct = {
        id: data.id,
        photo: data.photo,
        brand: data.brand,
        name: data.name,
        price: data.price
      };

      const allCart = [...foundUser[0].cart, newProduct];

      await users.updateOne(
        { email: data.email },
        { $set: { cart: allCart } },
        { upsert: true }
      );

      res.end();
    });


    app.get('/product', async(req, res) => {
      const cursor = productCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/product/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await productCollection.findOne(query);
      res.send(result);
    })
    // ======
    app.get('/allProduct/:brand_name', async(req, res) => {
      const carName = req.params.brand_name;
      const cursor = productCollection.find();
      const result = await cursor.toArray();
      const allCars = result.filter(car => car.brand).filter(car => car.brand.toLowerCase().trim() === carName.toLowerCase().trim())
      console.log(allCars)
      res.json(allCars)
    })

    //==========

    app.post('/product', async (req, res) => {
      const newProduct = req.body;
      const result = await productCollection.insertOne(newProduct)
      console.log(result);
      res.send(result)
    })

    app.put('/product/:id', async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const options = { upsert: true };
      const updatedProducts = req.body;
      const products = {
        $set: {
          name: updatedProducts.name, 
          photo: updatedProducts.photo,
          brand: updatedProducts.brand,
          type: updatedProducts.type,
          price: updatedProducts.price,
          description: updatedProducts.description,
          rating:updatedProducts.rating
        }
      }

      const result = await productCollection.updateOne(filter, products, options);
      res.send(result)
    })




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// mongodb




app.get('/', (req, res) => {
  res.send('Automotive Server Is Running')
})

app.listen(port, () => {
  console.log(`Automotive Server Is Running On Port: ${port}`);
})