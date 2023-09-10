const axios = require('axios');
function getSpotifyAccessToken(clientId, clientSecret) {
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    
    const data = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
    });
    
    return axios
        .post(tokenUrl, data, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        })
        .then((response) => {
        return response.data.access_token;
        })
        .catch((error) => {
        throw error;
        });
    }
async function getSongURI(title, artist, apiKey) {
    const query = `${title} ${artist}`;
    
    try {
        const response = await axios.get(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
        });
    
        // Check if the response contains tracks.
        if (response.data.tracks && response.data.tracks.items.length > 0) {
        const trackURI = response.data.tracks.items[0].uri;
        return trackURI;
        }
    } catch (error) {
        console.error('Error fetching Spotify data:', error);
    }
    return null;
    }
async function getSpotifyURIs(songs) {
    const uris = [];
    const access_token = await getSpotifyAccessToken(process.env.CLIENT_ID, process.env.CLIENT_SECRET)
    const songValues = songs.split(',');
    for (let i = 0; i < songValues.length; i += 2) {
        const title = songValues[i];
        const artist = songValues[i + 1];
        const uri = await getSongURI(title, artist, access_token);
        if (uri) {
            uris.push(uri);
        }
    }
    const uriString = uris.join(',');
    
    return uriString;
}
module.exports = {
    getSpotifyURIs
  };