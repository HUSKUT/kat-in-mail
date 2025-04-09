var express = require('express');
var router = express.Router();
const fetch = require('node-fetch');
const firebase = require('firebase-admin');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const dotenv = require('dotenv');
const { applicationDefault } = require('firebase-admin/app');
const mail = require('@sendgrid/mail');
const { get } = require('https');
dotenv.config();
let mails = [];
let catimg;

let store;

async function generateCat() {
  await fetch('https://api.thecatapi.com/v1/images/search?size=full')
    .then((response) => response.json())
    .then((data) => {
      catimg = data[0].url;
    });
}
async function initFirebase() {
  // Initialize Firebase
  const app = firebase.initializeApp({
    credential: applicationDefault(),
    databaseURL: process.env.FIRESTORE_DATABASE_URL,
  });
  // Initialize Cloud Firestore and get a reference to the service
  store = firebase.firestore(app);
}

async function getCollection() {
  await generateCat();
  try {
    await store
      .collection('/users')
      .get()
      .then(async (querySnapshot) => {
        querySnapshot.forEach((doc) => {
          console.log('Document data:', doc.data().email);
          mails.push({
            from: {
              name: 'Kat in Mail',
              email: process.env.SENDGRID_FROM_EMAIL,
            },
            template_id: process.env.SENDGRID_TEMPLATE_ID,
            subject: 'Dagelijkse kat',
            personalizations: [
              {
                to: [doc.data().email],
                subject: 'Dagelijkse kat',
                dynamic_template_data: {
                  USERID: doc.id,
                  CATIMAGE: catimg,
                },
                headers: {
                  'X-Entity-Ref-ID':
                    Math.random().toString(36).substring(2, 15) +
                    Math.random().toString(36).substring(2, 15),
                },
              },
            ],
          });
        });
      });
  } catch (e) {
    console.error('Error getting document: ', e);
  }
}
initFirebase().then((r) => console.log('connection made'));
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/image', async function (req, res, next) {
  await generateCat();
  fetch(catimg).then((resp) => {
    res.writeHead(200, { 'content-type': 'image/jpeg' });
    resp.pipe(res);
  });
});

router.get('/kim/unsubscribe', function (req, res, next) {
  if (req.query.user == null) return res.send('No user specified');
  firebase
    .firestore()
    .collection('users')
    .doc(req.query.user)
    .delete()
    .then(() => {
      res.send('Unsubscribed!');
    })
    .catch((e) => {
      res.send('Error unsubscribing: ' + e);
    });
});

router.post('/kim/send', async function (req, res) {
  await getCollection();

  if (req.body.token === process.env.MAIL_TOKEN) {
    res.send('Sent mails!');
    sgMail
      .sendMultiple(mails)
      .then((response) => {
        console.log('response', response[0]);
      })
      .catch((error) => {
        console.log('error', error.response.body.errors);
      });
  } else {
    res.send('Invalid token, doei.');
  }
});

module.exports = router;
