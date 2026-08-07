require('dotenv').config();
const express = require('express');
const cors = require('cors');


const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

  } catch(error){
    console.log(error);
  }
}
run().catch(console.dir);


