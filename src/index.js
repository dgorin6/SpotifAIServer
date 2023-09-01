const express = require('express');
require("dotenv").config();
const { OpenAI } = require("openai");
const app = express();
app.use(express.json())
const port = 3000;
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

async function authenticateWithSpotify() {
  const authResponse = await axios.post('https://accounts.spotify.com/api/token', null, {
    params: {
      grant_type: 'client_credentials',
    },
    auth: {
      username: process.env.CLIENT_ID,
      password: process.env.CLIENT_SECRET,
    },
  });

  return authResponse.data.access_token;
}
app.get('/', async (req, res) => {
  res.json({ message: 'Hello from SpotifAI!' });
});
app.post('/playlist', async (req, res) => {
    const description = req.body.description;
    const model_prompt = `
    Generate a playlist based on the given description and format it as a CSV with the song name followed by the artist. If the input doesn't make sense, return False. + 

    Description: "${description}"
    
    Playlist Format:
    [song_1_name], [artist_1]
    [song_2_name], [artist_2]
    [song_3_name], [artist_3]
    ...
`;
console.log(model_prompt)
  try {
    if (description == null) {
      throw new Error("Uh oh, no prompt was provided");
    }
    const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{
          "role": "system",
          "content": "You are a helpful assistant."
        },
        {
          "role": "user",
          "content": model_prompt
        }],
      });
      console.log(completion)
      res.json({"playlist": completion.choices[0].message.content});
  } catch (error) {
    console.log(error.message);
  }
});
app.listen(port, () => {
  console.log(`Microservice listening at http://localhost:${port}`);
});