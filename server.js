// const express = require('express');
// const multer = require('multer');
// const fs = require('fs');
// const path = require('path');
// const bodyParser = require('body-parser');

// const app = express();
// const PORT = process.env.PORT || 3000;

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// // Paths for uploads, users, and file metadata.
// const uploadFolder = path.join(__dirname, 'uploads');
// const usersFile = path.join(__dirname, 'users.json');
// const filesMetaFile = path.join(__dirname, 'files.json');

// // Ensure uploads folder exists.
// if (!fs.existsSync(uploadFolder)) {
//   fs.mkdirSync(uploadFolder);
// }

// // Ensure users.json exists.
// if (!fs.existsSync(usersFile)) {
//   fs.writeFileSync(usersFile, JSON.stringify([]));
// }

// // Ensure files.json exists.
// if (!fs.existsSync(filesMetaFile)) {
//   fs.writeFileSync(filesMetaFile, JSON.stringify([]));
// }

// // Multer configuration for multiple file uploads.
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadFolder);
//   },
//   filename: (req, file, cb) => {
//     const uniqueName = Date.now() + '-' + file.originalname;
//     cb(null, uniqueName);
//   }
// });
// const upload = multer({ storage });

// // Serve static files from public and uploads folders.
// app.use(express.static('public'));
// app.use('/uploads', express.static(uploadFolder));

// // Utility functions for JSON file operations.
// function readJSON(filePath) {
//   try {
//     const data = fs.readFileSync(filePath);
//     return JSON.parse(data);
//   } catch (err) {
//     return [];
//   }
// }

// function writeJSON(filePath, data) {
//   fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
// }



// // 🚀 **Signup Route**
// app.post('/signup', (req, res) => {
//   const { username, password } = req.body;
//   let users = readJSON(usersFile);

//   if (users.find(user => user.username === username)) {
//     return res.status(400).json({ error: 'Username already exists' });
//   }

//   users.push({ username, password });
//   writeJSON(usersFile, users);
//   res.json({ message: 'User registered successfully' });
// });

// // 🚀 **Login Route**
// app.post('/login', (req, res) => {
//   const { username, password } = req.body;
//   let users = readJSON(usersFile);
//   const user = users.find(u => u.username === username && u.password === password);

//   if (!user) {
//     return res.status(401).json({ error: 'Invalid credentials' });
//   }

//   res.json({ message: 'Login successful', username });
// });






// // Upload endpoint (protected) – accepts multiple files.
// app.post('/upload', upload.array('images', 10), (req, res) => {
//   const user = req.query.user;
//   console.log({user});
  
//   if (!user) {  // Check if user is provided.
//     return res.status(400).json({ error: 'User not provided' });
//   }

//   if (req.files && req.files.length > 0) {
//     let filesMeta = readJSON(filesMetaFile);
//     req.files.forEach(file => {
//       const meta = {
//         id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
//         filename: file.filename,
//         originalname: file.originalname,
//         uploadDate: new Date(),
//         uploader: user
//       };
//       filesMeta.push(meta);
//     });
//     writeJSON(filesMetaFile, filesMeta);
//     res.json({ message: 'Files uploaded successfully', files: req.files });
//   } else {
//     res.status(400).json({ error: 'No files uploaded.' });
//   }
// });


// // Get images endpoint with search and sort (protected).
// app.get('/images', (req, res) => {
//   const user = req.query.user;
//   if (!user) {  // Check if user is provided.
//     return res.status(400).json({ error: 'User not provided' });
//   }
//   try {
//     let filesMeta = readJSON(filesMetaFile);

//     // Filter files so that only the logged-in user's files are returned.
//     filesMeta = filesMeta.filter(file => file.uploader === user);
//     console.log({filesMeta});


//     let { query, sort } = req.query;

//     // Filter by search query (by original filename).
//     if (query) {
//       filesMeta = filesMeta.filter(file =>
//         file.originalname.toLowerCase().includes(query.toLowerCase())
//       );
//     }

//     // Sort based on sort parameter.
//     if (sort) {
//       if (sort === 'date_desc') {
//         filesMeta.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
//       } else if (sort === 'date_asc') {
//         filesMeta.sort((a, b) => new Date(a.uploadDate) - new Date(b.uploadDate));
//       } else if (sort === 'name_asc') {
//         filesMeta.sort((a, b) => a.originalname.localeCompare(b.originalname));
//       } else if (sort === 'name_desc') {
//         filesMeta.sort((a, b) => b.originalname.localeCompare(a.originalname));
//       }
//     }

//     // Map file metadata to include a URL.
//     const images = filesMeta.map(file => ({
//       id: file.id,
//       url: `/uploads/${file.filename}`,
//       originalname: file.originalname,
//       uploadDate: file.uploadDate,
//       uploader: file.uploader
//     }));

//     console.log({images});
//     res.json({ images: images.length !== 0 ? images : [] });

//   } catch (error) {
//     console.error('Error fetching images:', error);
//     res.status(500).json({ error: 'Failed to fetch images' });
//   }
// });


// // Delete image endpoint (protected).
// app.delete('/image', (req, res) => {
//   const user = req.query.user;
//   if (!user) {  // Check if user is provided.
//     return res.status(400).json({ error: 'User not provided' });
//   }
//   const { id } = req.body;
//   let filesMeta = readJSON(filesMetaFile);
//   const fileIndex = filesMeta.findIndex(file => file.id === id);
//   if (fileIndex === -1) {
//     return res.status(404).json({ error: 'File not found' });
//   }
//   const fileToDelete = filesMeta[fileIndex];
//   // Delete the file from disk.
//   fs.unlink(path.join(uploadFolder, fileToDelete.filename), (err) => {
//     if (err) {
//       return res.status(500).json({ error: 'Failed to delete file from disk' });
//     }
//     // Remove metadata.
//     filesMeta.splice(fileIndex, 1);
//     writeJSON(filesMetaFile, filesMeta);
//     res.json({ message: 'File deleted successfully' });
//   });
// });

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });




const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Paths for uploads, users, and file metadata.
const uploadFolder = path.join(__dirname, 'uploads');
const usersFile = path.join(__dirname, 'users.json');
const filesMetaFile = path.join(__dirname, 'files.json');

// Ensure uploads folder exists.
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

// Ensure users.json exists.
if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, JSON.stringify([]));
}

// Ensure files.json exists.
if (!fs.existsSync(filesMetaFile)) {
  fs.writeFileSync(filesMetaFile, JSON.stringify([]));
}

// Multer configuration for multiple file uploads.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Serve static files from public and uploads folders.
app.use(express.static('public'));
app.use('/uploads', express.static(uploadFolder));

// Utility functions for JSON file operations.
function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// 🚀 Signup Route
app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  let users = readJSON(usersFile);

  if (users.find(user => user.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  // In production, always hash passwords.
  users.push({ username, password });
  writeJSON(usersFile, users);
  res.json({ message: 'User registered successfully' });
});

// 🚀 Login Route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  let users = readJSON(usersFile);
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({ message: 'Login successful', username });
});

// Upload endpoint (protected) – accepts multiple files.
app.post('/upload', upload.array('files', 10), (req, res) => {
  const user = req.query.user;
  
  if (!user) {  // Check if user is provided.
    return res.status(400).json({ error: 'User not provided' });
  }

  if (req.files && req.files.length > 0) {
    let filesMeta = readJSON(filesMetaFile);
    req.files.forEach(file => {
      const meta = {
        id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        filename: file.filename,
        originalname: file.originalname,
        uploadDate: new Date(),
        uploader: user
      };
      filesMeta.push(meta);
    });
    writeJSON(filesMetaFile, filesMeta);
    res.json({ message: 'Files uploaded successfully', files: req.files });
  } else {
    res.status(400).json({ error: 'No files uploaded.' });
  }
});

// Get images endpoint with search and sort (protected).
app.get('/images', (req, res) => {
  const user = req.query.user;
  if (!user) {  // Check if user is provided.
    return res.status(400).json({ error: 'User not provided' });
  }
  try {
    let filesMeta = readJSON(filesMetaFile);

    // Return only files uploaded by the logged-in user.
    filesMeta = filesMeta.filter(file => file.uploader === user);

    let { query, sort } = req.query;

    // Filter by search query (using original filename).
    if (query) {
      filesMeta = filesMeta.filter(file =>
        file.originalname.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Sort based on the sort parameter.
    if (sort) {
      if (sort === 'date_desc') {
        filesMeta.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
      } else if (sort === 'date_asc') {
        filesMeta.sort((a, b) => new Date(a.uploadDate) - new Date(b.uploadDate));
      } else if (sort === 'name_asc') {
        filesMeta.sort((a, b) => a.originalname.localeCompare(b.originalname));
      } else if (sort === 'name_desc') {
        filesMeta.sort((a, b) => b.originalname.localeCompare(a.originalname));
      }
    }

    // Map file metadata to include a URL.
    const images = filesMeta.map(file => ({
      id: file.id,
      url: `/uploads/${file.filename}`,
      originalname: file.originalname,
      uploadDate: file.uploadDate,
      uploader: file.uploader
    }));

    res.json({ images });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// Delete image endpoint (protected).
app.delete('/image', (req, res) => {
  const user = req.query.user;
  if (!user) {  // Check if user is provided.
    return res.status(400).json({ error: 'User not provided' });
  }
  const { id } = req.body;
  let filesMeta = readJSON(filesMetaFile);
  const fileIndex = filesMeta.findIndex(file => file.id === id);

  if (fileIndex === -1) {
    return res.status(404).json({ error: 'File not found' });
  }

  const fileToDelete = filesMeta[fileIndex];
  
  // Ensure that only the uploader can delete the file.
  if (fileToDelete.uploader !== user) {
    return res.status(403).json({ error: 'Unauthorized to delete this file' });
  }
  
  // Delete the file from disk.
  fs.unlink(path.join(uploadFolder, fileToDelete.filename), (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete file from disk' });
    }
    // Remove file metadata.
    filesMeta.splice(fileIndex, 1);
    writeJSON(filesMetaFile, filesMeta);
    res.json({ message: 'File deleted successfully' });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
