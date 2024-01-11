const fs = require("fs");
const https = require("https");
const express = require("express");
const app = express();
const priceList = {
 mocha: 5,
 latte: 7,
 cookies: 2,
};

const getPrice = require("./helpers");
const { WebhookClient } = require("dialogflow-fulfillment");

app.get("/", (req, res) => {
 res.send("Hi from server!");
});

app.post("/", express.json(), (req, res) => {
 const agent = new WebhookClient({ request: req, response: res });

 function handleIntent(agent) {
    const intent = agent.intent;
    const item = agent.contexts[0].parameters.item;
    const quantity = agent.contexts[0].parameters.quantity;
    const billingAmount = getPrice(intent, item, quantity, priceList);

    const response =
      intent === "Take Order - yes"
        ? `Great! Your ${quantity} ${item} and cookies will be ready in no time. Please pay ${billingAmount}$.`
        : `Okay! Your ${quantity} ${item} will be ready in no time. Please pay ${billingAmount}$.`;

    agent.add(response);
 }

 const intentMap = new Map();
 intentMap.set("Take Order - yes", handleIntent);
 intentMap.set("Take Order - no", handleIntent);
 agent.handleRequest(intentMap);
});

const httpsServer = https.createServer(
 {
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem"),
 },
 app
);

httpsServer.listen(8080, () => {
 console.log("server running...");
});

module.exports = function (intent, item, quantity, priceList) {
 const total =
    intent === "Take Order - yes"
      ? priceList[`${item}`] * quantity + priceList["cookies"]
      : priceList[`${item}`] * quantity;

 return total;
};