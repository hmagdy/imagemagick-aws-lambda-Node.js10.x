
var aws = require('aws-sdk');
var s3 = new aws.S3({apiVersion: '2006-03-01'});
const imageThumbnail = require('image-thumbnail');


/**
 * Global DEBUG setting
 * @type {boolean}
 */
const DEBUG = false;

/**
 *
 * @type {number}
 */
const RESIZE_WIDTH = 150;

lol = async function (event, context) {

    if (DEBUG) {
        console.log('Received event:', JSON.stringify(event, null, 2));
    }

    // Get the object from the event and show its content type
    // var bucket = ''event.Records[0].s3.bucket.name;
    // var key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

    // Get the object from the event and show its content type
    var bucket = 'mystaff-files';// event.Records[0].s3.bucket.name;

    var key = decodeURIComponent('1-original.jpg'.replace(/\+/g, ' '));



    var params = {
        Bucket: bucket,
        Key: key
    };

    const image = await s3.getObject(params).promise();
    console.log(image);
    // const resizedImg = await sharp(image.Body).resize(RESIZE_WIDTH, RESIZE_WIDTH).max().toBuffer();


    try {
        let options = { width: RESIZE_WIDTH }
        const resizedImg = await imageThumbnail(image.Body, options);
        console.log(resizedImg);
        // resize OK
        var newObject = {
            Bucket: bucket,
            Key: key.replace('-original', '-small'),
            Body: resizedImg,
            ContentType: image.ContentType
        };
        const updated = await s3.putObject(newObject).promise();
        if (DEBUG) {
            console.log('resize - OK', newObject);
        }
    } catch (err) {
        console.error(err);
    }


};

(async () => {
    try {
        await lol()
        console.log('DONE');
    } catch (e) {
        console.log('HBL');
        console.log(e);
        // Deal with the fact the chain failed
    }
})();
