var express = require('express');
var router = express.Router();
const fetch = require("node-fetch");
const firebase = require("firebase-admin");
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const dotenv = require('dotenv');
const {applicationDefault} = require("firebase-admin/app");
dotenv.config();
let mails = [];


    const firebaseConfig = process.env.FIREBASE_CONFIG ?? firebase.credential.cert({
        "type": process.env.FIREBASE_ACC_TYPE,
        "project_id": process.env.FIREBASE_PROJECT_ID,
        "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
        "private_key": process.env.FIREBASE_PRIVATE_KEY,
        "client_email": process.env.FIREBASE_CLIENT_EMAIL,
        "client_id": process.env.FIREBASE_CLIENT_ID,
        "auth_uri": process.env.FIREBASE_AUTH_URI,
        "token_uri": process.env.FIREBASE_TOKEN_URI,
        "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL
    }) // For prod, or local dev
// stupid workaround because i suck at this
// TODO: fix this

async function initFirebase() {
// Initialize Firebase
    const app = firebase.initializeApp({
        credential: firebaseConfig,
        databaseURL: process.env.FIRESTORE_DATABASE_URL
    });
// Initialize Cloud Firestore and get a reference to the service

    const store = firebase.firestore(app);
    try {
        await store.collection("/users").get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                mails.push(doc.data().email);
            });
        });
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

initFirebase().then(r => console.log('connection made'));

let html;

async function generateCat() {
    await fetch('https://api.thecatapi.com/v1/images/search?size=full').then((response) => response.json())
        .then((data) => {
            console.log(data[0].url)
            html = '<h1>Dagelijkse kat</h1>'
            html += '<img src="' + data[0].url + '">';
        });
    return html;
}

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

router.post('/kim/send', async function (req, res) {
    if (req.body.token === process.env.MAIL_TOKEN) {
        await generateCat();
        console.log('html', html)
        const msg = {
            to: mails,
            from: {
                name: 'Kat in Mail',
                email: process.env.SENDGRID_FROM_EMAIL
            },
            subject: 'Dagelijkse kat',
            html: html,
        }

        res.send('Sent mails!');
        sgMail
            .sendMultiple(msg)
            .then((response) => {
                console.log('response', response[0].statusCode)
                // console.log(response[0].headers)
            })
            .catch((error) => {
                console.error(error)
            })
    } else {
        res.send('Invalid token, doei.');
    }
});

module.exports = router;
