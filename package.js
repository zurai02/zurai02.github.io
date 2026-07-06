{
  "name": "zurai02-portfolio",
  "version": "1.0.0",
  "description": "zurai02 personal portfolio",
  "main": "dist/server.js",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only server.ts",
    "build": "npm run build:wasm && tsc",
    "build:wasm": "wasm-pack build --target web --out-dir pkg",
    "start": "node dist/server.js",
    "deploy": "gh-pages -d .",
    "ai:train": "node ai.js train",
    "ai:serve": "node ai.js serve"
  },
  "dependencies": {
    "express": "^4.19.2",
    "@xenova/transformers": "^2.17.2",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "ts-node-dev": "^2.0.0",
    "@types/express": "^4.17.21",
    "@types/node": "^20.14.2",
    "gh-pages": "^6.1.1"
  }
}
