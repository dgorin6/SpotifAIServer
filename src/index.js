const express = require('express');
require("dotenv").config();
const { OpenAI } = require("openai");
const app = express();
app.use(express.json())
const port = 3000;
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

function standardizeOutput(input) {
    // Remove double quotes, backslashes, and extra spaces around commas
    const standardized = input.replace(/"/g, '').replace(/\\/g, '').replace(/\s*,\s*/g, ',').replace(/\n/g, '');
  
    return standardized;
  }
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

async function getPlaylist(description) {
  const system_prompt = `
    You are a playlist generating robot. In order to generate a playlist, you will take in a description as an input.
    This description could be a theme, a pattern, etc. To the best of your ability, create a playlist using this description.
  `;
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
    {"role": "system", "content": "you are a helpful assistant"},
    {"role": "user","content": system_prompt},
    {"role": "user","content": "Awaiting description"},
    {"role": "user","content": description},
  ],
  });
  const unformatted_playlist = completion.choices[0].message.content
  console.log(unformatted_playlist)
  const format_prompt = `Your role is to convert this text into a format that I can use for data processing. You will recieve output from another LLM which contains a music playlist. Return the playlist to me in the below format.
  The only text you output should be text that was input for data processing. Do not acknowledge my request or add additional text. \n
  format: song_1_name,artist_1,song_2_name,artist_2 ,song_3_name,artist_3,...\n
  example: Don't Stop Believin',Journey,Billie Jean,Michael Jackson,Eye of the Tiger,Survivor, Sweet Child o' Mine,Guns N' Roses,Every Breath You Take,The Police, Livin' on a Prayer,Bon Jovi`;

  const format_completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
    {"role": "system", "content": format_prompt},
    {"role": "user","content": unformatted_playlist},
  ],
  });
  return standardizeOutput(format_completion.choices[0].message.content);
}
app.get('/', async (req, res) => {
  res.json({ message: 'Hello from SpotifAI!' });
});
app.post('/playlist', async (req, res) => {
  const description = req.body.description;
  try {
    if (description == null) {
      throw new Error("Uh oh, no prom`pt was provided");
    }
    const playlist = await getPlaylist(description)
    return res.json({playlist: playlist})
  } catch (error) {
    console.log(error.message);
  }
});
app.listen(port, () => {
  console.log(`Microservice listening at http://localhost:${port}`);
});