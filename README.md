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

## Core Concepts

### Action Tracking

The foundation of Authsignal is tracking user actions to determine if additional verification is needed:

```typescript
const result = await authsignal.track({
  userId: "user-123",
  action: "signIn", // Your custom action code defined in Authsignal
  attributes: {
    redirectUrl: "https://yourapp.com/callback", // URL to redirect after challenge completion
  },
});

// Handle the result based on state
switch (result.state) {
  case "ALLOW":
    // Proceed with normal flow
    break;
  case "BLOCK":
     // Block the user from signing in
    break;
  case "CHALLENGE_REQUIRED":
    // Redirect user to challenge URL
    const challengeUrl = result.url;
    break;
}
```

### Handling Challenges

When a challenge is required, you'll need to either:

1. Redirect the user to the challenge URL (pre-built UI)
2. Use the idempotency key for custom challenge flows with client SDKs

```typescript
// Option 1: Redirect to challenge URL
res.redirect(result.url);

// Option 2: Custom flow using idempotency key
const challengeStatus = await authsignal.getAction({
  userId: "user-123",
  action: "signIn",
  idempotencyKey: result.idempotencyKey,
});
```

### Validating Challenges

After a user completes a challenge, validate the result with the token:

```typescript
const validationResult = await authsignal.validateChallenge({
  token: "eyJhbGciOiJ...", // Token from redirect or client SDK
});

if (validationResult.state === "CHALLENGE_SUCCEEDED") {
  // Authentication successful - proceed with user flow
} else {
  // Authentication failed
}
```

## API Reference

The SDK provides the following method groups:

### User Management

- **getUser(request)**: Retrieves user details and their enrolled authenticators
- **updateUser(request)**: Updates user attributes
- **deleteUser(request)**: Deletes a user from Authsignal

### Authenticator Management

- **getAuthenticators(request)**: Retrieves a list of authenticators for a user
- **enrollVerifiedAuthenticator(request)**: Enrolls a pre-verified authenticator for a user
- **deleteAuthenticator(request)**: Deletes a specific authenticator for a user

### Action and Challenge Management

- **track(request)**: Tracks an action and evaluates if MFA is required
- **getAction(request)**: Retrieves the status of a previously tracked action
- **updateAction(request)**: Updates an action's attributes
- **getChallenge(request)**: Retrieves the status of a challenge
- **validateChallenge(request)**: Validates a completed challenge

### Webhook Verification

- **webhook.constructEvent(payload, signature)**: Verifies incoming Authsignal webhook signatures

## Example Use Cases

### User Sign-In Flow

```typescript
// Example function showing how to integrate with a sign-in flow
async function handleSignIn(userId) {
  try {
    const result = await authsignal.track({
      userId,
      action: "signIn",
      attributes: {
        redirectUrl: "https://yourapp.com/auth/callback",
      },
    });

    if (result.state === "ALLOW") {
      // Complete sign-in process
      return { success: true };
    } else if (result.state === "BLOCK") {
      // Deny access
      return { success: false, reason: "blocked" };
    } else if (result.state === "CHALLENGE_REQUIRED") {
      // Return challenge URL for redirect
      return { 
        success: false, 
        reason: "challenge",
        challengeUrl: result.url,
        idempotencyKey: result.idempotencyKey
      };
    }
  } catch (error) {
    console.error("Authsignal error:", error);
    // Handle error appropriately
  }
}
```

### Enrolling a Verified Authenticator

```typescript
// Example for enrolling a verified phone number for SMS authentication
async function enrollVerifiedPhone(userId, phoneNumber) {
  try {
    const result = await authsignal.enrollVerifiedAuthenticator({
      userId,
      attributes: {
        verificationMethod: "SMS",
        phoneNumber,
        isDefault: true
      }
    });
    
    return result;
  } catch (error) {
    console.error("Error enrolling phone:", error);
    throw error;
  }
}
```

### Available Verification Methods

The SDK supports these verification methods:

- `SMS` - SMS-based OTP
- `EMAIL_OTP` - Email-based OTP
- `EMAIL_MAGIC_LINK` - Magic links via email
- `AUTHENTICATOR_APP` - TOTP authenticator apps
- `PASSKEY` - WebAuthn passkeys
- `SECURITY_KEY` - Physical security keys
- `PUSH` - Push notifications
- `RECOVERY_CODE` - Recovery codes

## Webhooks

Authsignal can send webhooks for various events. Verify webhook signatures to ensure they're legitimate:

```typescript
// Express example
app.post('/webhooks/authsignal', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-signature-v2'];
  
  try {
    // Verify webhook signature and parse event
    const event = authsignal.webhook.constructEvent(
      req.body,
      signature
    );
    
    // Handle different webhook event types
    switch(event.type) {
      case 'authentication.succeeded':
        // Handle successful authentication
        break;
      case 'authentication.failed':
        // Handle failed authentication
        break;
      // Handle other event types
    }
    
    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send('Webhook error');
  }
});
```

**Note:** Webhook verification requires the raw request body. Many frameworks automatically parse JSON, which will cause signature verification to fail.

## Error Handling

The SDK throws `AuthsignalError` objects with detailed information about failures:

```typescript
try {
  const response = await authsignal.getUser({ userId });
} catch (e) {
  if (e instanceof AuthsignalError) {
    const statusCode = e.statusCode;    // HTTP status code
    const errorCode = e.errorCode;      // Error type code
    const errorDescription = e.errorDescription; // Human-readable description
  }
}
```

## Development

* **Lint:** `yarn lint`
* **Build:** `yarn build`
* **Test:** `yarn test`

## License

This SDK is licensed under the [MIT License](LICENSE.md).

## Documentation

For more information and advanced usage examples, refer to the official [Authsignal Server-Side SDK documentation](https://docs.authsignal.com/sdks/server/overview).