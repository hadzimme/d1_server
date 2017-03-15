const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
const uuidV4 = require('uuid/v4');
const multer = require('multer');
const fs = require('fs');

const app = express();
const upload = multer({ dest: './tmp/' });

app.get('/v1/?', (req, res) => {
  res.contentType('application/json');
  res.send(JSON.stringify({ message: 'Hello, world!' }));
});

app.post('/v1/files', upload.fields([{ name: 'upload' }]), (req, res) => {
  const file = req.files.upload[0];
  const fileId = uuidV4();
  const fileName = file.originalname;
  const tmpPath = file.path;
  const targetPath = './files/' + fileId;
  fs.rename(tmpPath, targetPath, error => {
    if (error) throw error;
    fs.unlink(tmpPath, () => {
      if (error) throw error;
      res.json({
        id: fileId,
        message: targetPath + ' - ' + file.size + ' bytes',
      });
    });
  });
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
