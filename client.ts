import path from 'path';
import readline from 'readline';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { ProtoGrpcType } from './proto/random';

const PORT = 8082;
const PROTO_FILE = './proto/random.proto';

const packageDef = protoLoader.loadSync(path.resolve(__dirname, PROTO_FILE));
const grpcObj = (grpc.loadPackageDefinition(packageDef) as unknown) as ProtoGrpcType;

const client = new grpcObj.randomPackage.Random(
    `0.0.0.0:${PORT}`,
    grpc.credentials.createInsecure(),
)

const deadline = new Date();
deadline.setSeconds(deadline.getSeconds() + 5);
client.waitForReady(deadline, (err) => {
    if (err) {
        console.error(err);
        return;
    }
    onClientReady();
})

const onClientReady = () => {
    // basic
    // client.PingPong({ message: "Ping" }, (err, result) => {
    //     if (err) {
    //         console.error(err);
    //         return;
    //     }
    //     console.log(result);
    // })

    // server streaming
    // const stream = client.RNG({ maxVal: 85 });
    // stream.on("data", (chunk) => {
    //     console.log(chunk);
    // });
    // stream.on("end", () => {
    //     console.log("communication ended");
    // })

    // client streaming
    // const stream = client.TodoList((err, result) => {
    //     if (err) {
    //         console.log(err);
    //         return;
    //     }
    //     console.log(result);
    // });
    // stream.write({ todo: 'walk dog', status: 'never' })
    // stream.write({ todo: 'walk cat', status: 'doing' })
    // stream.write({ todo: 'walk dragon', status: 'impossible' })
    // stream.write({ todo: 'walk lizard', status: 'done' })
    // stream.end()

    // bidirectional streaming
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })

    const username = process.argv[2];
    if (!username) {
        console.error('no username')
        process.exit(1);
    }
    const metadata = new grpc.Metadata();
    metadata.set('username', username);
    const call = client.Chat(metadata);

    call.write({
        message: 'register',
    });

    call.on('data', (chunk) => {
        console.log(`${chunk.username} ===> ${chunk.message}`);
    });

    rl.on('line', (line) => {
        if (line === 'quit') {
            call.end();
        } else {
            call.write({ message: line })
        }
    })
};