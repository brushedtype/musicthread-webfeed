# MusicThread Feed Generator

A light microservice to serve [Atom 1.0 Feeds](https://www.rfc-editor.org/rfc/rfc4287) for [MusicThread](https://musicthread.app) threads using the same URL path schema (i.e. `/thread/<THREAD_KEY>`).

## Architecture

The microservice is a single Javascript file (`src/main.js`) powered by [Node.js](https://nodejs.org/en/) and [Cloudflare Workers](https://workers.cloudflare.com)' CLI, [wrangler](https://github.com/cloudflare/wrangler2). However, the microservice isn't tighly coupled to this environment may be trivially integrated into other environments, if desired.

## Installation

If using [wrangler](https://github.com/cloudflare/wrangler2), no manual changes to the configuration or code are necessary. If this is your approach, ensure you follow the steps below, taken from [Cloudflare](https://www.cloudflare.com)'s ["Get started guide"](https://developers.cloudflare.com/workers/get-started/guide):

1. Clone the latest release.
2. Install [node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm), if you haven't already.
3. In the repo's root, execute `npm install` to pull down all dependencies.
4. Install wrangler with `npm install -g wrangler`.
5. Link `wrangler` with your Cloudflare account with `wrangler login`, following the guided setup to completion.

## Usage

To run the service locally for development (your service will be available at `http://localhost:8787`):

```bash
$ npm run start
```

To deploy a fresh build to your Cloudflare Worker account (which from then on will be publically accessible):

```bash
$ npm run deploy
```

Following a deployment, simply target the address with a valid MusicThread thread path (e.g. `/thread/221MoMPiOUJiqUoTVONYHiqjZEK`) and subscribe to that complete URL in your [RSS Reader of choice](https://www.reederapp.com) or [IFTTT](https://ifttt.com) automation pipeline.