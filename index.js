const express = require('express')
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken');
app.use(cors())
app.use(express.json())
require('dotenv').config()
const port = process.env.PORT || 5000

const { MongoClient, ServerApiVersion } = require('mongodb');
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


async function run() {
  try {
    await client.connect();
    const productCollection = client.db("bike-parts").collection('products');
    const orderCollection = client.db("bike-parts").collection('order');
    const userCollection = client.db("bike-parts").collection('users');
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
    // order
    app.post('/order', async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order)
      return res.send({ success: true, result })
    });
    // All user verifyJWT,
    app.get('/user',verifyJWT,  async (req, res) => {
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
    // admin
    app.get('/admin/:email', async (req, res) => {
      const email = req.params.email
      const user = await userCollection.findOne({ email: email })
      const isAdmin = user.role === 'admin'
      res.send({ admin: isAdmin })
    })
    // admin check
    // app.put('/user/admin/:email', verifyJWT, verifyAdmin, async (req, res) => {
    //   const email = req.params.email
    //   const filter = { email: email }
    //   const updateDoc = {
    //     $set: { role: 'admin' }
    //   }
    //   const result = await userCollection.updateOne(filter, updateDoc)

    //   res.send(result)


    // })
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
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ result, token })
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