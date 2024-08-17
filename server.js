require('dotenv').config(); 
const express = require("express");
const twilio = require("twilio");

const app = express();
app.use(express.urlencoded({ extended: false })); // For parsing POST request bodies

// Find your Account SID and Auth Token at twilio.com/console
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const twilioNumber = process.env.TWILIO_NUMBER;
const toNumber = '+918109543070'; // Fixed number for outgoing calls


// Route to create a call
app.get("/make-call", async (req, res) => {
  try {
    const call = await client.calls.create({
      from: twilioNumber, // Fixed outgoing call number
      to: toNumber,     // Dynamic destination number
      url: "http://demo.twilio.com/docs/voice.xml",
    });

    //console.log(call.sid);
    res.redirect("/voice"); // Redirect to the /voice route after successful call creation
    console.log(call.sid);
  } catch (error) {
    console.error("Error creating call:", error);
    res.redirect("/error"); // Redirect to an error route if something goes wrong
  }
});

// Route to handle Twilio webhook requests
app.post("/voice", (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();

  const gather = twiml.gather({
    numDigits: 1,
    action: "/gather",
  });
  gather.say("For sales, press 1. For support, press 2.");

  // If the user doesn't enter input, loop
  twiml.redirect("/voice");


  // Render the response as XML in reply to the webhook request
  res.type("text/xml");
  res.send(twiml.toString());
});

// Route to handle <Gather> input
app.post("/gather", (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();

  if (req.body.Digits) {
    switch (req.body.Digits) {
      case "1":
        twiml.say("You selected sales. Good for you!");
        break;
      case "2":
        twiml.say("You need support. We will help!");
        break;
      default:
        twiml.say("Sorry, I don't understand that choice.");
        twiml.pause();
        twiml.redirect("/voice");
        break;
    }
  } else {
    twiml.redirect("/voice");
  }

  res.type("text/xml");
  res.send(twiml.toString());
});

app.get("/error", (req, res) => {
  res.send("There was an error creating the call.");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
