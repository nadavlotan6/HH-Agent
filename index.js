const express = require('express');
const app = new express();
const port = process.env.PORT || 3000;
const server = require('http').createServer(app);
const io = require('socket.io')(server)
const dir = __dirname;
const fs = require('fs');
const timers = require('timers');
const readline = require('readline');
const {
    google
} = require('googleapis');
const dateFormat = require('dateformat');
let now = new Date();
let twoHoursEarlier = now.getTime() - 2 * 60 * 60 * 1000;
let twoHoursAhead = now.getTime() + (2 * 60 * 60 * 1000);
let address = '';
let spreadsheetId = '1I6ADcGlCqYTH7bQD9v19FLvNcbZUjCkUiq82sgQHlnU';
let range = 'Format!A:K';

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content), listMajors);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const {
        client_secret,
        client_id,
        redirect_uris
    } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error while trying to retrieve access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function listMajors(auth) {
    const sheets = google.sheets({
        version: 'v4',
        auth
    });
    sheets.spreadsheets.values.get({
        spreadsheetId: '1I6ADcGlCqYTH7bQD9v19FLvNcbZUjCkUiq82sgQHlnU',
        range: 'Format!A:K',
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const rows = res.data.values;
        if (rows.length) {
            console.log('ID, Address:');
            // Print columns A and E, which correspond to indices 0 and 4.
            rows.map((row) => {
                if (row[9] == dateFormat(now, "dd/mm/yyyy") && (row[10] >= dateFormat(twoHoursEarlier, "HH:MM") && row[10] <= dateFormat(twoHoursAhead, "HH:MM"))) {
                    console.log(`${row[0]}, ${row[1]}, ${row[2]}, ${row[3]}, ${row[4]}, ${row[5]}, ${row[6]},`);
                    address = row[4];
                }
                //   console.log(dateFormat(now, "isoDate"));
                //   console.log(dateFormat(now, "dd/mm/yyyy"));
                //   console.log(dateFormat(now, "HH:MM"));
                //   console.log(dateFormat(twoHoursAhead, "HH:MM"));
                //   console.log(dateFormat(twoHoursEarlier, "HH:MM"));
            });
        } else {
            console.log('No data found.');
        }
    });
}

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(dir + '/index.html');
    fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Sheets API.
        authorize(JSON.parse(content), listMajors);
    });
    res.sendFile(dir + '/index.html');
});

io.on('connection', function (socket) {
    socket.emit('change_address', {
        address: address
    });
});

server.listen(port, () => {
    console.log("listening on port 3000");
});