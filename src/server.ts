import { createClient, commandOptions } from 'redis';
import emailService from './email.service';

async function streamConsumer() {
  const client = createClient({
    url: 'redis://dacs_redis_db:6379',
  });

  console.log('Connecting to redis...');

  await client.connect();

  console.log('Connected!');

  let currentId = '0-0'; // Start at lowest possible stream ID

  while (true) {
    try {
      console.log('Waiting for messages...');

      let response: any = await client.xRead(
        commandOptions({
          isolated: true,
        }), [
          // XREAD can read from multiple streams, starting at a
          // different ID for each...
          {
            key: 'mailing-stream',
            id: currentId,
          }
        ], {
          // Read 1 entry at a time, block for 5 seconds if there are none.
          COUNT: 1,
          BLOCK: 10000,
        }
      );

      if (response) {
        const { name, messages } = response;

        console.log(`Message received: [${name}]: ${messages}`);

        messages.forEach(({id, message: { message }}) => {
          try {
            const { from, to, subject, body, plain } = JSON.parse(message);
            emailService().sendEmail(from, to, subject, body, plain);
          } catch (e) {
            console.log(`error parsing message [${id}]: `, e);
          }
        });

        // Get the ID of the first (only) entry returned.
        currentId = response[0].messages[0].id;
      } else {
        console.log('No new stream entries.');
      }
    } catch (err) {
      console.error(err);
    }
  }
}

streamConsumer();
