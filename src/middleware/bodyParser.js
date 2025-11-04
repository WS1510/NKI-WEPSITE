const bodyParser = require('body-parser');

// Allow larger payloads for attachments encoded as data URLs
const jsonParser = bodyParser.json({ 
    limit: process.env.BODY_JSON_LIMIT || '12mb' 
});

const urlEncodedParser = bodyParser.urlencoded({ 
    extended: true, 
    limit: process.env.BODY_JSON_LIMIT || '12mb' 
});

module.exports = [jsonParser, urlEncodedParser];