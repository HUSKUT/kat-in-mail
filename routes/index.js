var express = require('express');
var router = express.Router();
const fetch = require("node-fetch");
const firebase = require("firebase-admin");
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const dotenv = require('dotenv');
const {applicationDefault} = require("firebase-admin/app");
const {defaultAppStore} = require("firebase-admin/lib/app/lifecycle");
dotenv.config();
let mails = [];


async function initFirebase() {
// Initialize Firebase


    const app = firebase.initializeApp({
        credential: applicationDefault(),
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
