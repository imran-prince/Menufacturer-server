const express = require('express')
const app = express()
const port = process.env.PORT || 5000

app.get('/', (req, res) => {
  res.send('Princes parts limited')
})

app.listen(port, () => {
  console.log(`Welcome to  port ${port}`)
})