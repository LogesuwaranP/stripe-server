const express = require("express");
const serverless = require("serverless-http");
require("dotenv").config();
const express = require("express");
const cors = require("cors")
const stripe = require('stripe')('sk_test_51Ng0z7SCR8uhq7yDYmqsNGqfParoSuERmqZHinU8xXH1AcJV27JwKZvlq5NV94g6nhJB7hKVTSsnZraViwEkjxgg00HFTohGXk');

const app = express();
app.use(cors());
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    hello: "hi!"
  });
});


router.post('/create-checkout-session', async (req, res) => {
    const { customerId,priceId } = req.body;
  
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId, // Replace with your actual price ID
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: 'http://localhost:3000/custom',
        cancel_url: 'http://localhost:3000/cancel',
        // Additional session options
      });
  
      res.json({ id: session.id });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

app.use(`/.netlify/functions/api`, router);

module.exports = app;
module.exports.handler = serverless(app);