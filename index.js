const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs').promises;

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const TMP_DIR = '/tmp/files';  // Directory for temporary file storage

// Helper function to read files from a directory
async function getFilesFromDirectory(directory) {
    try {
        return await fs.readdir(directory);
    } catch (err) {
        console.error('Error reading directory:', err);
        throw new Error('Unable to read directory');
    }
}

// Helper function to read a file's content
async function readFileContent(filePath) {
    try {
        return await fs.readFile(filePath, 'utf-8');
    } catch (err) {
        console.error('Error reading file:', err);
        throw new Error('Unable to read file');
    }
}

// Helper function to write content to a file
async function writeFileContent(filePath, content) {
    try {
        await fs.writeFile(filePath, content);
    } catch (err) {
        console.error('Error writing file:', err);
        throw new Error('Unable to write file');
    }
}

// Ensure the /tmp/files directory exists
async function ensureDirectoryExists(directory) {
    try {
        await fs.mkdir(directory, { recursive: true });
    } catch (err) {
        console.error('Error creating directory:', err);
        throw new Error('Unable to create directory');
    }
}

// Route to display list of files
app.get('/', async (req, res) => {
    try {
        await ensureDirectoryExists(TMP_DIR);  // Ensure the directory exists
        const files = await getFilesFromDirectory(TMP_DIR);
        res.render('index', { files });
    } catch (err) {
        console.error('Error displaying files:', err);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});

// Route to display a single file's content
app.get('/files/:filename', async (req, res) => {
    const tmpFilePath = path.join(TMP_DIR, req.params.filename);
    try {
        const filedata = await readFileContent(tmpFilePath);
        res.render('show', { filename: req.params.filename, filedata });
    } catch (err) {
        console.error('Error reading the file:', err);
        res.status(500).send('Unable to read the file: ' + err.message);
    }
});

// Route to show the file editing page
app.get('/edit/:filename', (req, res) => {
    res.render('edit', { filename: req.params.filename });
});

// Route to rename a file
app.post('/edit', async (req, res) => {
    const { previous, new: newName } = req.body;
    const previousPath = path.join(TMP_DIR, previous);
    const newPath = path.join(TMP_DIR, newName);
    try {
        await fs.rename(previousPath, newPath);
        res.redirect('/');
    } catch (err) {
        console.error('Error renaming file:', err);
        res.status(500).send('Error renaming the file: ' + err.message);
    }
});

// Route to create a new file
app.post('/create', async (req, res) => {
    const { title, details } = req.body;
    const filename = title.split(' ').join('') + '.txt';
    const filePath = path.join(TMP_DIR, filename);
    try {
        await fs.writeFile(filePath, details);
        res.redirect('/');
    } catch (err) {
        console.error('Error creating file:', err);
        res.status(500).send('Unable to create file: ' + err.message);
    }
});

// Start the server
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    await ensureDirectoryExists(TMP_DIR);  // Ensure the directory exists before starting the server
    console.log(`Server started on http://localhost:${PORT}`);
});


// Export the app as the handler for Vercel's serverless function
module.exports = app;
