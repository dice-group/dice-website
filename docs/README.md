# Docs

## How do I edit / add new resource (project / person / etc)?

1. Clone / fork the repo
2. Create new branch from `develop` and name it according to your changes
3. Copy `_Example.ttl` file corresponding to your entity type in `data/[type]` folder and rename it to `YourResource.ttl`
4. Edit `YourResource.ttl` file as required
5. If you need to add images - drop them into `images/` folder (it is recommended to make use of subfolders)
6. Commit your changes
7. Create Pull Request toward `develop` branch of this repo (PRs have automated checks, so we'll see if anything is broken immediately)

## What properties do resources have?

Check `_Example.ttl` file in `data/[type]` folder - those examples have complete set of properties you can use.

## I want to build / run it locally!

1. Make sure you have Node.js installed
2. Clone the repo
3. Enter scripts folder: `cd scripts`
4. Install deps: `npm install`
5. Run project in development mode: `npm start`
6. Build for production: `npm run build`
7. Start for production (once build is done): `npm run serve`

For more info see [README](../scripts/README.md) in `scripts` folder.
