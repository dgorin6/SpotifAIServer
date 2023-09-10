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
  const prompt = req.body.prompt;
  try {
    if (prompt == null) {
      throw new Error("Uh oh, no prompt was provided");
    }
    const playlist = await OpenAIService.getStandardizedPlaylist(prompt)
    const uris = await SpotifyService.getSpotifyURIs(playlist)
    return res.json({"playlist": uris})
    
  } catch (error) {
    console.log(error.message);
  }
});
app.post('/createPlaylist', async (req, res) => {
  const uris = req.body.uris;
  const title = req.body.title;
  const authToken = req.body.authToken
  const userId = req.body.userId;
  try {
    if (uris == null) {
      throw new Error("playlist is null");
    } else if (title == null) {
      throw new Error("title is null");
    } else if (authToken == null) {
      throw new Error("accessToken is null");
    }
    const link = await OpenAIService.createPlaylist(uris, title, authToken, userId);
    return res.json({"link": link})
  } catch (error) {
    console.log(error.message);
  }
});
app.listen(port, () => {
  console.log(`Microservice listening at http://localhost:${port}`);
});