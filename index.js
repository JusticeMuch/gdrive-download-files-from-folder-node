const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
var MimeLookup = require('mime-lookup');
var mime = new MimeLookup(require('mime-db'));


const SCOPES = ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/drive.metadata.readonly'];

const TOKEN_PATH = 'token.json';

fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  authorize(JSON.parse(content), listFiles);
});


function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

function getAccessToken(oAuth2Client, callback) {
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
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token)
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}



async function listFiles(auth) {
    var folderid = "1_GmHJW1Qt6QgU8ywLXEjAh3MirEsB7oO"; 
    var outputExtension = "php";
  
    var outputMimeType = mime.lookup(outputExtension);
    var service = google.drive('v3');
    console.log(outputMimeType);
    service.files.list({
      auth: auth,
      q: "'" + folderid + "' in parents and trashed=false",
      fields: "files(id, name, mimeType)"
    }, function(err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }
      const drive = google.drive({version: 'v3', auth});
      Object.entries(response.data.files).forEach(function (key){

         var fileId =  key[1]['id'];
        var fileName = key[1]['name'];
        var dest = fs.createWriteStream('test/'+fileName);
        drive.files.get({fileId: fileId, alt: 'media'}, {responseType: 'stream'},
            function(err, res){
               res.data
               .on('end', () => {
                  console.log('Done');
               })
               .on('error', err => {
                  console.log('Error', err);
               })
               .pipe(dest);
            });
      })
    });
  }

