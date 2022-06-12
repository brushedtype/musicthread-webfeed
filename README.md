# MusicThread RSS

A light microservice to serve [Atom 1.0 Feeds](https://www.rfc-editor.org/rfc/rfc4287) for [MusicThread](https://musicthread.app/).

People use the RSS feeds for following updates to specific threads via their RSS reader, or as part of automations with services like [IFTTT](https://ifttt.com). If you have a novel use for MusicThread RSS, please let us know!

MusicThread RSS is run by MusicThread at https://rss.musicthread.app/ but individuals may want to run their own fork with modifications.

URLs follow the same path structure as on the main website (i.e. `/thread/<THREAD_KEY>`). Private threads are not currently supported and attempting to access them will return an error.

## Architecture

MusicThread RSS is designed to be run using [Cloudflare Workers](https://workers.cloudflare.com/).

The code is available in a single Javascript file (`src/main.js`) and should be trivially integrated into other environments if needed.

If you're interested in opening a PR to support running MusicThread RSS in other environments, please open an issue so we can discuss it first.

### Local development

MusicThread RSS requires [node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm), [wrangler](https://github.com/cloudflare/wrangler2) and a [Cloudflare](https://www.cloudflare.com) account.

An introduction to Cloudflare Workers is available here: ["Get started guide"](https://developers.cloudflare.com/workers/get-started/guide).

To get set up locally:

 1. Clone the latest release
 2. In the project's root, run `npm install` to install all dependencies
 3. Run `npm run dev` to run the local development server and watch the code for changes (the development service is available at `http://localhost:8787`)

> Note: You may need to run `npm run cf-login` to sign into your Cloudflare account if this is your first time using Cloudflare Workers.

### Deployment

Updates to the MusicThread hosted service are deployed manually, typically after merging into the `main` branch.

Deploying to your own Cloudflare account can be done by running `npm run deploy`, however additional setup may be needed. Please refer to Cloudflare's documentation for help.

If deploying to your own Cloudflare account, you should be aware of their request limits and pricing plans.
