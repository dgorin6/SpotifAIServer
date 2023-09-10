const { OpenAI } = require("openai");
const axios = require('axios');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
    });
function standardizeOutput(input) {
    const standardized = input.replace(/"/g, '').replace(/\\/g, '').replace(/\s*,\s*/g, ',').replace(/\n/g, '');

    return standardized;
}

async function format_playlist(unformatted_playlist) {
    const format_prompt = `
        Your role is to convert this text into a format that I can use for data processing. You will recieve output from another LLM which contains a music playlist. Return the playlist to me in the below format.
        The only text you output should be text that was input for data processing. Do not acknowledge my request or add additional text. \n
        format: song_1_name,artist_1,song_2_name,artist_2 ,song_3_name,artist_3,...
        example: Don't Stop Believin',Journey,Billie Jean,Michael Jackson,Eye of the Tiger,Survivor, Sweet Child o' Mine,Guns N' Roses,Every Breath You Take,The Police, Livin' on a Prayer,Bon Jovi
    `;

    const format_completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
        {"role": "system", "content": format_prompt},
        {"role": "user", "content": unformatted_playlist},
        ],
    });

    return format_completion.choices[0].message.content;
}

async function getInitialPlaylist(description) {
    const system_prompt = `
        You are a playlist generating robot. In order to generate a playlist, you will take in a description as an input.
        This description could be a theme, a pattern, etc. To the best of your ability, create a playlist using this description.
        Aim for 20 songs unless otherwise specified by the user.
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
    const formatted_playlist = await format_playlist(initialPlaylsit)
    return standardizeOutput(formatted_playlist)
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