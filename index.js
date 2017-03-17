const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
const uuidV4 = require('uuid/v4');
const multer = require('multer');
const fs = require('fs');

const app = express();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './files');
  },
  filename: (req, file, cb) => {
    cb(null, uuidV4());
  },
});
const upload = multer({ storage });

app.get('/v1/?', (req, res) => {
  res.json({ message: 'Hello, world!' });
});

app.get('/v1/files/:id', (req, res) => {
  res.attachment('./files/' + req.params.id);
  res.end();
});

app.post('/v1/files', upload.single('file'), (req, res) => {
  res.json({ id: req.file.filename });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
  const location = url.parse(ws.upgradeReq.url, true);
  ws.on('message', message => {
    console.log('Received: %s', message);
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});

server.listen(8080, () => {
  console.log('Example app listening on port 8080.');
});
