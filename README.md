<img width="1070" alt="Authsignal" src="https://raw.githubusercontent.com/authsignal/authsignal-node/main/.github/images/authsignal.png">

# Authsignal Node.js SDK

[![NPM version](https://img.shields.io/npm/v/@authsignal/node.svg)](https://npmjs.org/package/@authsignal/node)
[![License](https://img.shields.io/npm/l/@authsignal/node.svg)](https://github.com/authsignal/authsignal-node/blob/main/LICENSE.md)

The official Authsignal Node.js library for server-side applications. Use this SDK to easily integrate Authsignal's multi-factor authentication (MFA) and passwordless features into your Node.js backend.

## Installation

Using npm:
```bash
npm install @authsignal/node
```

Using yarn:
```bash
yarn add @authsignal/node
```

Using pnpm:
```bash
pnpm add @authsignal/node
```

Using bun:
```bash
bun add @authsignal/node
```

## Getting Started

Initialize the Authsignal client with your secret key from the [Authsignal Portal](https://portal.authsignal.com/) and the API URL for your region.

```typescript
import { Authsignal } from "@authsignal/node";

// Initialize the client
const authsignal = new Authsignal({
  apiSecretKey: process.env.AUTHSIGNAL_SECRET_KEY,
  apiUrl: process.env.AUTHSIGNAL_API_URL, // Use region-specific URL
});
```

### API URLs by Region

| Region      | API URL                          |
| ----------- | -------------------------------- |
| US (Oregon) | https://api.authsignal.com/v1    |
| AU (Sydney) | https://au.api.authsignal.com/v1 |
| EU (Dublin) | https://eu.api.authsignal.com/v1 |

## License

This SDK is licensed under the [MIT License](LICENSE.md).

## Documentation

For more information and advanced usage examples, refer to the official [Authsignal Server-Side SDK documentation](https://docs.authsignal.com/sdks/server/overview).