cmd
- yarn init -y
- add packages
- touch server.ts (create files)
- touch client.ts
- touch proto-gen.sh
- mkdir proto
- cd proto
- touch random.proto
- code in needed info
- yarn proto:gen
    -chmod +x proto-gen.sh (if permission denied)

run
- yarn start
- yarn client
- yarn client (username) (for chat)
- yarn proto:gen (run after editing random.proto)