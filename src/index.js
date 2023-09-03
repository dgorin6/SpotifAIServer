const express = require('express');
require("dotenv").config();
const OpenAIService = require("./services/OpenAIService");
const SpotifyService = require("./services/SpotifyService")
const cors = require('cors');
const app = express();
app.use(express.json())
app.use(cors())
const port = 3000;
app.get('/', async (req, res) => {
  res.json({ message: 'Hello from SpotifAI!' });
});
app.post('/playlist', async (req, res) => {
  console.log(req.body)
  const prompt = req.body.prompt;
  try {
    if (prompt == null) {
      throw new Error("Uh oh, no prompt was provided");
    }
    const playlist = await OpenAIService.getStandardizedPlaylist(prompt)
    console.log(playlist)
    const uris = await SpotifyService.getSpotifyURIs(playlist)
    return res.json({"playlist": uris})
    
  } catch (error) {
    console.log(error.message);
  }
});
app.listen(port, () => {
  console.log(`Microservice listening at http://localhost:${port}`);
});