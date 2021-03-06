/* eslint-disable no-console */
const amqp = require('amqplib/callback_api');
const RabbitmqConstants = require('./RabbitmqConstants');

let pubChannel = null;

function sendMsg(queueName, data) {
    // Assert Queue
    pubChannel.assertQueue(queueName);
    // Send message to queue
    pubChannel.sendToQueue(
        queueName,
        Buffer.from(JSON.stringify(data)),
        { persistent: true },
    );
    console.log('[RabbitmqPublisher.js#sendMsg] : Message send ', queueName);
}

function connectPubRabbitmq(queueName, data) {
    amqp.connect(RabbitmqConstants.CONN_URL, (connError, connection) => {
        if (connError) {
            console.log('[RabbitmqPublisher.js#connError] : publisher connError: ', connError);
        } else {
            // Create channel
            connection.createChannel((channelError, channel) => {
                if (channelError) {
                    console.log('[RabbitmqPublisher.js#chanelError] : publisher channelError: ', channelError);
                } else {
                    pubChannel = channel;
                    sendMsg(queueName, data);
                }
            });
        }
    });
}

// Added a process listener to close the RabbitMQ connection when we kill the process
process.on('exit', (code) => {
    pubChannel.close();
    console.log(`[RabbitmqPublisher.js#exit] : closing rabbitmq channel, code = ${code}`);
});

async function publishToQueue(queueName, data) {
    console.log('[RabbitmqPublisher.js#publishToQueue] : publishToQueue');
    if (!pubChannel) {
        connectPubRabbitmq(queueName, data);
    } else {
        sendMsg(queueName, data);
    }
}

module.exports = {
    publishToQueue,
}
