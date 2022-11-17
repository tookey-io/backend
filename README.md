# Tookey Backend

Tookey is assets and access management protocol for web3. We build secure environment to interact with crypto without risk of disclose the private key.

# Prerequisites

To use the backend, you will need the deployed manager and relay scripts, which are located in the appropriate repository.

Аn example of environment you can find in `.env.example`.

# Installation

```bash
$ npm install
```

# Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

# Contribution

To manage releases, please follow the workflow listed below:

1. Create your features and commit them. Execute the `npm run commit` in the command line to make a commit with Commitizen
2. Run `npm run release` to create a changelog and a semantic versioning-based release
