const aws = require('aws-sdk'),
    fs = require('fs'),
    s3 = new aws.S3(),
    path = require('path'),
    os = require('os'),
    childProcess = require('child_process');



const spawnPromise = function (command, argsarray, envOptions) {
    return new Promise((resolve, reject) => {
        console.log('executing', command, argsarray.join(' '));
        const childProc = childProcess.spawn(command, argsarray, envOptions || {
                env: process.env,
                cwd: process.cwd()
            }),
            resultBuffers = [];
        childProc.stdout.on('data', buffer => {
            console.log(buffer.toString());
            resultBuffers.push(buffer);
        });
        childProc.stderr.on('data', buffer => console.error(buffer.toString()));
        childProc.on('exit', (code, signal) => {
            console.log(`${command} completed with ${code}:${signal}`);
            if (code || signal) {
                reject(`${command} failed with ${code || signal}`);
            } else {
                resolve(Buffer.concat(resultBuffers).toString().trim());
            }
        });
    });
};

const downloadFileFromS3 = function (bucket, fileKey, filePath) {
    console.log('downloading', bucket, fileKey, filePath);
    return new Promise(function (resolve, reject) {
        const file = fs.createWriteStream(filePath),
            stream = s3.getObject({
                Bucket: bucket,
                Key: fileKey
            }).createReadStream();
        stream.on('error', reject);
        file.on('error', reject);
        file.on('finish', function () {
            console.log('downloaded', bucket, fileKey);
            resolve(filePath);
        });
        stream.pipe(file);
    });
}

const uploadFileToS3 = function (bucket, fileKey, filePath, contentType) {
    console.log('uploading', bucket, fileKey, filePath);
    return s3.upload({
        Bucket: bucket,
        Key: fileKey,
        Body: fs.createReadStream(filePath),
        ACL: 'private',
        ContentType: contentType
    }).promise();
};


exports.handler = async (event) => {
    // TODO implement


    const EXTENSION = '.jpg',
        THUMB_WIDTH ='150',
        inputBucket = 'Bucket',
        OUTPUT_BUCKET = 'Bucket',
        MIME_TYPE = 'image/jpeg',
        key = '0-original.jpg',
        id = 'f0dd5708bf0dce24434890109e1d2ca1',
        resultKey = key.replace('-original', '-small'),
        workdir = os.tmpdir(),
        inputFile = path.join(workdir, id + path.extname(key)),
        outputFile = path.join(workdir, 'converted-' + id + EXTENSION);


    console.log('converting', inputBucket, key, 'using', inputFile);
    return downloadFileFromS3(inputBucket, key, inputFile)
        .then(() => spawnPromise(
            '/opt/bin/convert',
            [inputFile, '-resize', `${THUMB_WIDTH}x`, outputFile],
            {env: process.env, cwd: workdir}
        ))
        .then(() => uploadFileToS3(OUTPUT_BUCKET, resultKey, outputFile, MIME_TYPE));



    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda2!'),
    };
    return response;
};
