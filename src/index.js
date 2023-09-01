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
    You are a playlist generating robot. In order to generate a playlist, you will take in a description as an input. You will have 2 states, awaiting and generating. In your awaiting state, ask for a description. Once a description is provided, you can have 2 possible outputs. The first is a generated playlist. Your playlist output must look exactly as below. NO ADDITONAL OUTPUT TEXT. Do not write anything before the playlist or after. However, if the input prompt does not make any sense in a playlist context, just output FALSE.

    Output Format:  song_1_name,artist_1,song_2_name,artist_2 ,song_3_name,artist_3,...

    Sample Input: 80's greatest hits

    Sample Output: Don't Stop Believin',Journey, Billie Jean,Michael Jackson,Eye of the Tiger, Survivor, Sweet Child o' Mine,Guns N' Roses,Every Breath You Take,The Police, Livin' on a Prayer,Bon Jovi

    Sample Input 2: safndanda

    Sample Output: FALSE
`;
console.log(model_prompt)
  try {
    if (description == null) {
      throw new Error("Uh oh, no prom`pt was provided");
    }
    const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{
          "role": "system",
          "content": model_prompt
        },
        {
          "role": "user",
          "content": description
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