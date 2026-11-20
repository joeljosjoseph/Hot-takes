# Hot Takes

A real-time multiplayer party game for the browser. One person hosts a room, friends join from their phones with a 4-letter code, everyone answers a silly prompt, and the group votes on the best answer.

## Features (so far)
- Create and join rooms with short shareable codes
- Live lobby that updates for everyone as players join and leave
- Players keep their identity across page refreshes
- Automatic host handover when the host disconnects
- Server-authoritative design: clients send requests, and the server validates them and owns the game state

## Tech stack
Next.js, React, TypeScript, Tailwind CSS (client), Node.js, Express, Socket.io (server)

## Run locally