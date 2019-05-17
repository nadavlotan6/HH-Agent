const express = require('express');
const app = new express();
const port = process.env.PORT || 3000;
const server = require('http').createServer(app);
const io = require('socket.io')(server)
const dir = __dirname;

app.use(express.static('public'));
app.get('/', (req, res) => {
    res.sendFile(dir + '/index.html');
});

var address = 'שנקר 3, הרצליה';
setTimeout(function() {
    address = 'שמאי 4, הרצליה';
    io.emit('change_address', {
        address: address
    });
}, 400);

io.on('connection', function(socket) {
    socket.emit('change_address', {
        address: address
    });
});



server.listen(port, () => {
    console.log("listening on port 3000");
});