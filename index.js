const express = require('express')
const cors = require('cors');
const bodyParser = require('body-parser');

const port = 5000;
require('dotenv').config()
console.log(process.env.DB_USER, process.env.DB_PASS)
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.u2qyt.mongodb.net/burjalarabDB?retryWrites=true&w=majority`;

const app = express();
app.use(cors());
app.use(bodyParser.json());


var admin = require("firebase-admin");

var serviceAccount = require("./configs/burj-al-arab0-firebase-adminsdk-u9uar-f1a6706b8a.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB
});

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true});
client.connect(err => {
  const collection = client.db("burjalarabDB").collection("bookings");
  app.post('/addBooking', (req, res) => {
      const newBooking = req.body;
      collection.insertOne(newBooking)
      .then(result =>{
          res.send( result.insertedCount > 0 );
      })
  })

  app.get('/bookings', (req, res) =>{
    const bearer = req.headers.authorization;
    if(bearer && bearer.startsWith('Bearer ')){
      const idToken = bearer.split(' ')[1];
      admin.auth().verifyIdToken(idToken)
      .then(function(decodedToken) {
        let tokenEmail = decodedToken.email;
        console.log(tokenEmail, req.query.email)
        if(tokenEmail == req.query.email){
          collection.find({email: req.query.email})
          .toArray((err,documents)=>{
              res.send(documents);
          })
        }
        else{
          res.status(401).send('un-authorized access');
        }
      }).catch(function(error){
          res.status(401).send('un-authorized access');
      });
    }
    else{
      res.status(401).send('un-authorized access');
    }         
  })
});

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port)