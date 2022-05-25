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
 


async function run() {
    try {
      await client.connect();
      const productCollection = client.db("bike-parts").collection('products');
      // all product
      app.get('/product' ,async(req,res)=>{
        const result=await productCollection.find().toArray()
        res.send(result)

      })
    } finally {
 
    }
  }
  run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Princes parts limited')
})

app.listen(port, () => {
  console.log(`Welcome to  port ${port}`)
})