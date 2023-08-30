require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors")
const stripe = require('stripe')('sk_test_51Ng0z7SCR8uhq7yDYmqsNGqfParoSuERmqZHinU8xXH1AcJV27JwKZvlq5NV94g6nhJB7hKVTSsnZraViwEkjxgg00HFTohGXk');
const auth0 = require('auth0');

app.use(express.json());
app.use(cors());

var cid =""

const customerId = "cus_OUAElqexWbC1qA";
const amount = 1000; // Amount in cents (for example, $10.00)
const currency = 'inr';



app.get("/create-customer",async (req,res)=>{

        try {
          // const { paymentMethodId, email } = req.body;
      
          const customer = await stripe.customers.create({
            name: 'google-oauth2|105634165605327288405',
          });
      
          res.json({ customer });
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
    
})

// Create a Payment Intent
app.post('/create-payment-intent', async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // Amount in cents
      currency: currency,
      payment_method_types: ['card'],
      customer: customerId, // Replace with the actual customer ID
      description: 'Payment for your service',
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: 'Error creating payment intent.' });
  }
});

app.get("/subscriptions" ,async (req, res)=>{
  try {
    const prices = await stripe.prices.list({
      expand: ["data.product"],
    });
    products = [];
    prices.data.map((price) => {

      // Separate product object from price object
      product = price.product;
      delete price.product;

      // Is the product active?
      if (product.active) {
        
        // Can we find the product in the array already?
        if ((existingProduct = products.find(
            (p) => p.id === product.id
          ))) {

          // YES - add the new price to the existing item
          existingProduct.prices.push(price);

        } else {
          // NO - create new object and add to array
          products.push({ ...product, prices: [price] });

        }
      }
    });
   
    res.json(products)
    
  } catch (error) {
    console.log(error);
    
  }
})
;

app.get('/get-payment-details/:customerId', async (req, res) => {
  const customerId = req.params.customerId;

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: "cus_OUAElqexWbC1qA",
    });

    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ error: 'Error fetching payment details' });
  }
});

app.get('/get-user-payments/:customerId', async (req, res) => {
  const customerId = req.params.customerId;

  try {
    const payments = await stripe.paymentIntents.list({
      customer: customerId,
    });

    res.json(payments.data);
  } catch (error) {
    console.error('Error fetching user payments:', error);
    res.status(500).json({ error: 'Error fetching user payments' });
  }
});

app.get('/create-subscription', async (req, res) => {
  // const { planId } = req.body;
  // console.log(planId);

  try {
    // const { customerId } = req.body;

    const subscription = await stripe.subscriptions.create({
      customer: "cus_OVceE8Bv6a0gyH",
      items: [{ price: 'price_1Ni9c4SCR8uhq7yD3V0W0eHr' }],
    });

    res.json({ subscription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/create-session', async (req, res) => {
  // const { planId } = req.body;
  // console.log(planId);

  const priceId = 'prod_OUlwROcOmchSd3';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          // For metered billing, do not pass quantity
          quantity: 1,
        },
      ],

      success_url: 'https://example.com/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://example.com/canceled.html',})

  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Error creating subscription' });
  }
});


//Create Payment Method 
app.get('/create-payment-method', async (req, res) => {
  const cardInfo = {
    type: 'card',
    card: {
      number: '4242424242424242',
      exp_month: 12,
      exp_year: 23,
      cvc: '123',
    },
  };

  var paymentMethodId = ""

  stripe.paymentMethods.create(
    cardInfo,
    (error, paymentMethod) => {
      if (error) {
        console.error('Error creating payment method:', error);
        res.status(500).json({ id: paymentMethod.id });
      } else {
        // Send paymentMethod.id to your server logic
        paymentMethodId = paymentMethod.id;
        console.log('Payment method created:', paymentMethod.id);
        res.status(200).json({ id: paymentMethod.id });
      }
    }
  );

});


app.get('/get-subscription', async (req, res) => {
  try {
    const customerId = 'cus_OVg3rArTR4Daqx'; // Replace with the actual customer ID
    const customer = await stripe.customers.retrieve(customerId);

    // if (customer.subscriptions.data.length > 0) {
    //   const subscription = customer.subscriptions.data[0];
    //   res.json({ subscription });
    // } else {
      res.json({ subscription: customer });
    // }
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    res.status(500).json({ error: 'An error occurred while fetching subscription.' });
  }
});


app.get('/retrieve-subscription', async (req, res) => {
  try {
    const customerId = 'cus_OVg3rArTR4Daqx'; // Replace with the actual customer ID
    const subscription = await stripe.subscriptions.retrieve(
      'sub_1NiehlSCR8uhq7yDfZP9zp4F'
    );;
    
    // if (customer.subscriptions.data.length > 0) {
    //   const subscription = customer.subscriptions.data[0];
    //   res.json({ subscription });
    // } else {
      res.json({ subscription: subscription });
    // }
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    res.status(500).json({ error: 'An error occurred while fetching subscription.' });
  }
});

//Retrieve a plan
app.post('/retrieve-plan', async (req, res) => {
  const { planId } = req.body;

  try {

    const plan = await stripe.plans.retrieve(planId); 
    res.json({ plan: plan });

  } catch (error) {
    console.error('Error retrieving plan:', error);
    res.status(500).json({ error: error.message });
  }
});

//Retrieve a product
app.post('/retrieve-product', async (req, res) => {
  const { productId } = req.body;

  try {

    const product = await stripe.products.retrieve(productId); 
    res.json({ product: product });

  } catch (error) {
    console.error('Error retrieving plan:', error);
    res.status(500).json({ error: error.message });
  }
});


//Retrieve a customer
app.post('/retrieve-customer', async (req, res) => {
  const { customerId } = req.body;

  try {

    const customer = await stripe.customers.retrieve(customerId); 
    res.json({ customer: customer });

  } catch (error) {
    console.error('Error retrieving plan:', error);
    res.status(500).json({ error: error.message });
  }
});

//Search a customer
app.post('/search-customer', async (req, res) => {
  const { name } = req.body;

  try {

    const customer = await stripe.customers.search({
      query: 'name:\'fakename\' AND metadata[\'foo\']:\'bar\'',
    });
    res.json({ customer: customer });

  } catch (error) {
    console.error('Error retrieving plan:', error);
    res.status(500).json({ error: error.message });
  }
});

//update a customer
app.post('/update-customer', async (req, res) => {
  const { customerId } = req.body;

  try {

    const customer = await stripe.customers.update(
      customerId,
      {metadata: {
        plan : 'Premium',
        subscription_Id : "sub_1NiehlSCR8uhq7yDfZP9zp4F",
        product_Id : "prod_MudTUSUxXLIGqH"
      }}
    );
    res.json({ customer: customer });

  } catch (error) {
    console.error('Error retrieving plan:', error);
    res.status(500).json({ error: error.message });
  }
});


app.post('/update-subscription', async (req, res) => {
  const { customerId } = req.body;

  try {

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {price: 'price_1NhmOlSCR8uhq7yDs85ETkj5'},
      ],
    });
    res.json({ subscription: subscription });

  } catch (error) {
    console.error('Error retrieving plan:', error);
    res.status(500).json({ error: error.message });
  }
});


//Add Payment Method to user
app.post('/update-customer-payment', async (req, res) => {
  const { customerId } = req.body;

  try {

    await stripe.paymentMethods.attach("pm_1NiyImSCR8uhq7yDuLkXjqV0", {
      customer: customerId,
    });
    
    const customer = await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: "pm_1NiyImSCR8uhq7yDuLkXjqV0",
      },
    });
    res.json({ customer: customer });

  } catch (error) {
    console.error('Error retrieving plan:', error);
    res.status(500).json({ error: error.message });
  }
});



//Create Payment Method for a customer
app.post('/create-payment', async (req, res) => {
  const { customerId } = req.body;

  try {

    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: '4242424242424242',
        exp_month: 12,
        exp_year: 2034,
        cvc: '314',
      },
    });
    res.json({ paymentMethod: paymentMethod });

  } catch (error) {
    console.error('Error retrieving plan:', error);
    res.status(500).json({ error: error.message });
  }
});





//Check out session
app.post('/create-checkout-session', async (req, res) => {
  const { customerId,priceId } = req.body;

  // customerId = "cus_OVcn30utHxJxte";
  // var priceId = "price_1NhmJOSCR8uhq7yD0oD2qoMZ";


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






app.post('/user-subscription', async (req, res) => {
  const { customerId } = req.body;
  try {
    const customer = await stripe.customers.retrieve(customerId, {
      expand: ['subscriptions'],
    });;

    const activeSubscriptions = customer.subscriptions.data.filter(
      (subscription) => subscription.status === 'active' && subscription.plan.amount > 0
    );

    res.json({ activeSubscriptions });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/delete-subscription', async (req, res) => {
  const { planId } = req.body;
  try {

    const deletedSubscription = await stripe.subscriptions.del(planId);
    res.json({ message: 'Subscription canceled', subscription: deletedSubscription });


  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// const crypto = require('crypto');

// const clientId = 'kAPo45f4V6zz8oKCjhnmPkNVuVNiLkT5';
// const clientSecret = 'vg2lTv9ehGkmWn2v-k5PQZW-BYKu0amm6StM83xNrwYet6vMKmQeNOa8uBO6G1GB'; // Replace with your actual client secret
// const redirectUri = 'http://localhost:3000';
// const scope = 'openid profile email';
// const state = 'user_metadata';

// const baseParams = `client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
// const signature = crypto.createHmac('sha256', clientSecret).update(baseParams).digest('hex');
// const signedParams = `${baseParams}&signature=${signature}`;

// const url = `https://dev-bdz8bw32ikfdo8gm.us.auth0.com/authorize?response_type=code&${signedParams}`;

// console.log('Secure URL:', url);

// console.log(url);
// app.get(url,async(req,res)=>{
//   console.log(res)
//   console.log(req);
// })

  
app.listen(8080, function () {
console.log("Started application on port %d", 8080)
});