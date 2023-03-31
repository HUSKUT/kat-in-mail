var express = require('express');
var router = express.Router();
const fetch = require("node-fetch");

const dotenv = require('dotenv');

dotenv.config();

const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

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
    console.log(req.body.token)
    if (req.body.token === process.env.MAIL_TOKEN) {
        await generateCat();
        console.log('html', html)
        const msg = {
            to: process.env.SENDGRID_TO_EMAIL,
            from: {
                email: process.env.SENDGRID_FROM_EMAIL
            },
            subject: 'Dagelijkse kat',
            html: html,
        }

        res.send('Hello World');

        sgMail
            .send(msg)
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
