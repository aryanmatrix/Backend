const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middlewaree
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect("mongodb+srv://01fe21bcs235:uR0pvEj2YeieWiAW@cluster0.hekkphi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB', err));

// Playlist Model
// Playlist Model
const Playlist =
    mongoose.model('Playlist', new mongoose.Schema({
        name: { type: String, required: true },
        playlistCode:
        {
            type: String,
            required: true,
            unique: true
        }, // New field
        songs:
            [{ type: String }],
        // Store song titles directly
        user:
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        collaborators:
            [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                }]
    }));



// Song Model
// Song Model
const Song = mongoose.model('Song', new mongoose.Schema({
    title: { type: String, required: true },
    artist: { type: String, required: true },
    album: String,
    duration: { type: Number, required: true },
    audioUrl: { type: String, required: true }
    // Add audioUrl field for storing song file URL
}));


// Routes
// Playlists
app.get('/api/playlists', async (req, res) => {
    try {
        const playlists =
            await Playlist.find().populate('songs');
        res.json(playlists);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/playlists/:playlistName/songs', async (req, res) => {
    try {
        const playlistName =
            req.params.playlistName;
        const playlist =
            await Playlist.findOne({ name: playlistName }).populate('songs');
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }
        res.json(playlist.songs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});




app.post('/api/playlists', async (req, res) => {
    try {
        const { name, songs, user } = req.body;
        const playlist =
            new Playlist({ name, songs, user });
        await playlist.save();
        res.json(playlist);
    } catch (err) {
        console.error(err);
        res.status(500)
            .json({ error: 'Server error' });
    }
});

// Collaborative Playlists
app.post(
    '/api/playlists/:playlistId/collaborators', async (req, res) => {
        try {
            const { userId } = req.body;
            const playlist = await Playlist.findByIdAndUpdate(
                req.params.playlistId,
                { $addToSet: { collaborators: userId } },
                { new: true }
            );
            res.json(playlist);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    });

app.get('/api/playlists/collaborative/:userId', async (req, res) => {
    try {
        const playlists =
            await Playlist.find(
                {
                    collaborators: req.params.userId
                });
        res.json(playlists);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Songs
app.get('/api/songs', async (req, res) => {
    try {
        const { title, artist, album } = req.query;
        const filter = {};
        if (title) filter.title = new RegExp(title, 'i');
        if (artist) filter.artist = new RegExp(artist, 'i');
        if (album) filter.album = new RegExp(album, 'i');

        const songs =
            await Song.find(filter)
                .select('title artist album duration audioUrl');
        // Include audioUrl field
        res.json(songs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


app.post('/api/songs', async (req, res) => {
    try {
        const
            {
                title,
                artist,
                album,
                duration,
                audioUrl
            } = req.body;
        const song =
            new Song({ title, artist, album, duration, audioUrl });
        await song.save();
        res.json(song);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/songs/:songId', async (req, res) => {
    try {
        const songId = req.params.songId;
        // Assuming you have a Song model
        await Song.findByIdAndDelete(songId);
        res.json({ message: 'Song deleted successfully' });
    } catch (error) {
        console.error('Error deleting song:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500)
        .send('Something went wrong!');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT,
    () =>
        console.log(`Server running on port ${PORT}`)
);
