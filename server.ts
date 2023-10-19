import path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { ProtoGrpcType } from './proto/random';
import { RandomHandlers } from './proto/randomPackage/Random';
import { TodoResponse } from './proto/randomPackage/TodoResponse';
import { TodoRequest } from './proto/randomPackage/TodoRequest';
import { ChatRequest } from './proto/randomPackage/ChatRequest';
import { ChatResponse } from './proto/randomPackage/ChatResponse';

const PORT = 8082;
const PROTO_FILE = './proto/random.proto';

const packageDef = protoLoader.loadSync(path.resolve(__dirname, PROTO_FILE));
const grpcObj = (grpc.loadPackageDefinition(packageDef) as unknown) as ProtoGrpcType;
const randomPackage = grpcObj.randomPackage;

const main = () => {
    const server = getServer();

    server.bindAsync(
        `0.0.0.0:${PORT}`, 
        grpc.ServerCredentials.createInsecure(),
        (err, port) => {
            if (err) {
                console.error(err)
                return;
            }
            console.log(`Server started on ${port}`)
            server.start();
        }
    )
}

const todoList: TodoResponse = { todos: [] };
const callObjectByUsername = new Map<string, grpc.ServerDuplexStream<ChatRequest, ChatResponse>> ()

const getServer = () => {
    const server = new grpc.Server();
    server.addService(randomPackage.Random.service, {
        PingPong: (req, res) => {
            console.log(req.request);
            res(null, { message: 'Pong'})
        },
        RNG: (call) => {
            const { maxVal = 10 } = call.request;
            console.log(maxVal);

            let runCount = 0;
            const id = setInterval(() => {
                runCount = ++runCount;
                call.write({ num: Math.floor(Math.random() * maxVal) });
                if (runCount >= 10) {
                    clearInterval(id);
                    call.end();
                }
            }, 500)
        },
        TodoList: (call, callback) => {
            call.on('data', (chunk: TodoRequest) => {
                todoList.todos?.push(chunk);
                console.log(chunk);
            })

            call.on('end', () => {
                callback(null, { todos: todoList.todos });
            })
        },
        Chat: (call) => {
            call.on('data', (req) => {
                const username = call.metadata.get('username')[0] as string;
                const message = req.message;
                console.log(`${username}: ${req.message}`)

                for (let [user, usersCall] of callObjectByUsername) {
                    if (username !== user) {
                        usersCall.write({
                            username: username,
                            message: message,
                        })
                    }
                }

                if (callObjectByUsername.get(username) === undefined) {
                    callObjectByUsername.set(username, call);
                }
            })

            call.on('end', () => {
                const username = call.metadata.get('username')[0] as string;
                callObjectByUsername.delete(username);
                for (let [user, usersCall] of callObjectByUsername) {
                    if (username !== user) {
                        usersCall.write({
                            username: username,
                            message: 'has left the chat',
                        })
                    }
                }
                console.log(`${username} is ending their chat session`);

                call.write({
                    username: 'Server',
                    message: `Bye ${username}`,
                })

                call.end()
            })
        },
    } as RandomHandlers)

    return server;
}

main();