const express = require('express');
const app = new express();
const port = process.env.PORT || 3000;
const server = require('http').createServer(app);

app.use(express.static('public'));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// app.listen(3000, () => {
//     console.log("server listening on port 3000")
// })

server.listen(port, () => {
    console.log("listening on port 3000");
});