// redirect-server.js
const express = require('express');
const app = express();
const port = 3000;

// Redirect all routes to your actual frontend on port 8080
app.get('*', (req, res) => {
  const redirectUrl = `http://localhost:8080${req.originalUrl}`;
  console.log(`🔄 Redirecting from ${req.originalUrl} to ${redirectUrl}`);
  res.redirect(redirectUrl);
});

app.listen(port, () => {
  console.log(`🔄 Redirect server running on http://localhost:${port}`);
  console.log(`📨 All traffic will be redirected to http://localhost:8080`);
});