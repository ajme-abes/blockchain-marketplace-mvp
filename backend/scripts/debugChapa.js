const { v4: uuidv4 } = require('uuid');

const tx_ref = `debug-${uuidv4().split('-')[0]}`; // shortened ref

const payload = {
  amount: "10",
  currency: "ETB",
  email: "buyer@example.com",
  first_name: "Fresh",
  last_name: "Test",
  phone_number: "+251911223344",
  tx_ref,
  callback_url: "http://localhost:5000/api/payments/webhook/chapa",
  return_url: "http://localhost:3000/orders"
};
