// Requests here:
const fs = require('fs'); // Require the fs module.
const request = require('request'); // Require the request module.
const rp = require('request-promise'); // Require the request-promise module.
const cheerio = require('cheerio'); // Require the cheerio module.
const json2csv = require('json2csv').parse; // Require the json2csv module.

// Create a function to log errors.
function logError (error) {
    // Log error to console.
    console.log(`${error} error. Site could not be reached or there has been a problem.`);
    // Append error to scraper-error.log file.
    const errorDate = new Date(); // The time of the error.
    const errorLog = `[${errorDate}] ${error.message}\n`; // The error to be logged.
    // Log the error.
    fs.appendFile('scraper-error.log', errorLog, err => {
        if (err) throw err;
        console.log("Error has been detected. It has been logged to scraper-error.log.");
    });
}

// Create a function to get all of the shirt urls.
function getShirtURLs () {
    return new Promise( (resolve, reject) => {
        rp('http://shirts4mike.com/shirts.php').then( body => {
            const $ = cheerio.load(body);
            const shirtsURLs = []; // Create an array to hold all of the shirts urls.
            // Find the urls using the contains href attr and append them all to the shirtsURLs array.
            $( 'a[href^="shirt.php?id="]' ).each( (index, shirt) => {
                shirt = 'http://shirts4mike.com/' + $(shirt).attr('href');
                shirtsURLs.push(shirt);
            });
            return resolve(shirtsURLs);
        }).catch( err => {
            if (err) logError(err);
            return reject(err);
        });
    });
}

// Create a function to get the data for each shirt.
function getData (url) {
    return new Promise( (resolve, reject) => {
        rp(url).then( body => {
            const $ = cheerio.load(body);
            const time = new Date();
            return resolve({
                Title: $( 'div.shirt-details' ).find( 'h1' ).text().substring(4), // Title
                Price: $( 'span.price' ).text(), // Price
                ImageURL: $( '.shirt-picture' ).find( 'img' ).attr( 'src' ), // Image url
                URL: url, // Page url
                Time: time.toString() // The time.
            });
        }).catch( err => {
            if (err) logError(err);
            return reject(err);
        });
    });
}

// Create a function to append data to a csv file.
function appendToCsv (data) {
    // Check if a data directory doesn't exist.
    if (!fs.existsSync('data')) {
        fs.mkdirSync('data'); // If it doesn't, create the directory.
    }
    const date = new Date(); // Get the current date.
    const fn = `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + (date.getDate() + 1)).slice(-2)}.csv`;
    const fields = ['Title', 'Price', 'ImageURL', 'URL', 'Time']; // Header fields.
    const opts = { fields };
    const csvData = json2csv(data, opts); // Convert the data.
    // Append the csvData to the csv file.
    fs.writeFileSync('data/' + fn, csvData);
}

// Create a function to run other functions.
function main () {
    // Get the csv data.
    getShirtURLs().then( shirts => {
        return shirts;
    }).then( shirts => {
        Promise.all(shirts.map( getData )).then( data => {
            appendToCsv(data);
        });
    })
}

// Run the main function.
main();