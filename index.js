const express = require('express')
const app = express()
const cors=require('cors')
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
      // all product
      app.get('/product' ,async(req,res)=>{
        const result=await productCollection.find().toArray()
        res.send(result)

      })
      // order
      app.post('/order', async (req, res) => {
        const order = req.body;
        const result = await orderCollection.insertOne(order)
        return res.send({ success: true, result })
    });
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