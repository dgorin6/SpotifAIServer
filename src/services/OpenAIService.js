const { OpenAI } = require("openai");
const axios = require('axios');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
    });
function standardizeOutput(input) {
    const standardized = input.replace(/"/g, '').replace(/\\/g, '').replace(/\s*,\s*/g, ',').replace(/\n/g, '');
    return standardized;
}

async function getInitialPlaylist(description) {
    const system_prompt = `
    Your task is to generate playlist data based on a prompt. Playlist should be 20 songs unless otherwise specified. No matter the prompt, you must output a valid playlist of real songs. 
 
    output should be json with a single field called playlist, which is an array of songs with a title field and artist field.
    
    Await the following prompt.
    
    `;

    const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
        {"role": "system", "content": "you are a helpful assistant"},
        {"role": "user", "content": system_prompt},
        {"role": "user", "content": "Awaiting description"},
        {"role": "user", "content": "Description:" + description},
        ],
    });

    return completion.choices[0].message.content;
}
async function getStandardizedPlaylist(description) {
    const initialPlaylsit = await getInitialPlaylist(description)
    return standardizeOutput(initialPlaylsit)
}
async function createPlaylist(uris, playlistName, apiKey, userId) {
    try {
        const createPlaylistResponse = await axios.post(
            `https://api.spotify.com/v1/users/${userId}/playlists`,
            {
                name: playlistName,
                public: false
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const playlistId = createPlaylistResponse.data.id;
        const link = createPlaylistResponse.data.external_urls.spotify;
        await axios.post(
            `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
            {
                uris: uris,
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return link;
    } catch (error) {
        console.error('Error creating playlist:', error);
        return null;
    }
}
module.exports = {
    getStandardizedPlaylist,
    createPlaylist
  };