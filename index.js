const express = require('express')
const app = express()
const cors = require('cors')
const mg = require('nodemailer-mailgun-transport');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
app.use(cors({
  origin: true,
  optionsSuccessStatus: 200,
  credentials: true,
}))
app.use(express.json())
require('dotenv').config()
const port = process.env.PORT || 5000

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3s80f.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'Un-Autorized access' })
  }
  const token = authHeader.split(' ')[1]
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" })
    }

    req.decoded = decoded
    next()
  })

}
const auth = {
  auth: {
      api_key: '3d0f40f85c4d88f9014c80f33a13974a-8d821f0c-1c521e3d',
      domain: 'sandboxb565a25c96b6461c9ed36ef86f8af37e.mailgun.org'
  }
}
// mailgun 
const nodemailerMailgun = nodemailer.createTransport(mg(auth));
function sendOrderEmail(order) {
  const { productName, address, orderQuantity, phone } = order;

  var email = {
    from: "princes@help.com",
    to: "csebubt35@gmail.com",
    subject: `Your Appointment for ${productName} is Confirmed`,
    text: `Your Appointment for ${productName} is   is Confirmed`,
    html: `
        <div>
          
          <h3>Your Order for ${productName} is confirmed</h3>
          <h3>Your Order  Quantity ${orderQuantity} is confirmed</h3>
          <h3>Ypur Address ${address}</h3>
          <p>Bangladesh</p>
        </div>
      `,
  };

  nodemailerMailgun.sendMail(email, (err, info) => {
    if (err) {
      console.log(err);
    } else {
      console.log(info);
    }
  });
}


async function run() {
  try {
    await client.connect();
    const productCollection = client.db("bike-parts").collection('products');
    const orderCollection = client.db("bike-parts").collection('order');
    const userCollection = client.db("bike-parts").collection('users');
    const reviewCollection = client.db("bike-parts").collection('review');

    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email
      const requesterAccount = await userCollection.findOne({ email: requester })
      if (requesterAccount.role === 'admin') {
        next()
      }
      else {
        return res.status(403).send("Forbidden access")

      }

    }
    // all product
    app.get('/product', async (req, res) => {
      const result = await productCollection.find().toArray()
      res.send(result)

    })
    // all order
    app.get('/order', async (req, res) => {
      const result = await orderCollection.find().toArray()
      res.send(result)

    })
    // order create
    app.post('/order', async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order)
      sendOrderEmail(order)
      return res.send({ success: true, result })
    });
    // review create 
    app.post('/review', async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review)
      return res.send({ success: true, result })
    });
    // all review
    app.get('/review', async (req, res) => {
      const result = await reviewCollection.find().toArray()
      res.send(result)

    })

    // Delete product verifyJWT, verifyAdmin,
    app.delete('/product/:_id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params._id
      const query = { _id: ObjectId(id) }
      const result = await productCollection.deleteOne(query)
      res.send(result)
    })
    // Delete manage product by admin
    app.delete('/manageproduct/:_id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params._id
      const query = { _id: ObjectId(id) }
      const result = await orderCollection.deleteOne(query)
      res.send(result)
    })
    // cancel order 
    app.delete('/celcelorder/:_id', verifyJWT, async (req, res) => {
      const id = req.params._id
      const query = { _id: ObjectId(id) }
      const result = await orderCollection.deleteOne(query)
      res.send(result)
    })
    // All user verifyJWT,
    app.get('/user', verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray()
      res.send(users)

    })


    // My order
    app.get('/myorder', verifyJWT, async (req, res) => {
      const myorder = req.query.myorder
      const authorization = req.headers.authorization
      const decodedEmail = req.decoded.email
      if (myorder === decodedEmail) {
        const query = { customerEmial: myorder }
        const result = await orderCollection.find(query).toArray()
        return res.send(result)
      }
      else {

        return res.status(403).send("Forbidden access")
      }


    })
    // profile update 

    // admin
    app.get('/admin/:email', async (req, res) => {
      const email = req.params.email
      const user = await userCollection.findOne({ email: email })
      const isAdmin = user.role === 'admin'
      res.send({ admin: isAdmin })
    })
    // admin check
    app.put('/user/admin/:email', verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email
      const filter = { email: email }
      const updateDoc = {
        $set: { role: 'admin' }
      }
      const result = await userCollection.updateOne(filter, updateDoc)
      res.send(result)
    })
    // jwt sign in
    app.put('/user/:email', async (req, res) => {
      const email = req.params.email
      const filter = { email: email }
      const user = req.body
      const option = { upsert: true }
      const updateDoc = {
        $set: user
      }
      const result = await userCollection.updateOne(filter, updateDoc, option)
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '12h' })
      res.send({ result, token })
    })
    // sigle user
    app.get('/user/:email', async (req, res) => {
      const email = req.params.email
      const filter = { email: email }
      const result = await userCollection.findOne(filter)
      res.send(result)
    })
    // add product  verifyAdmin,
    app.post('/addproduct', verifyJWT, async (req, res) => {
      const newproduct = req.body
      const result = await productCollection.insertOne(newproduct)
      res.send(result)
    })
  } finally {

  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Princes parts limited company')
})

app.listen(port, () => {
  console.log(`Welcome to  port ${port}`)
})