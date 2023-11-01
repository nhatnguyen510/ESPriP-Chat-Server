<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# Chat Application API Documentation

This documentation provides an overview of the API routes available in the Chat Application built with NestJS. The API allows users to perform various actions related to authentication, conversations, messages, and friends.

## Authentication

### Login

- Endpoint: `/auth/login`
- Method: POST
- Description: Authenticates a user and generates an access token.
- Request Body: `{ "username": "nhatthuba0510", "password": "Nh@tthuba0510"}`
- Response: Returns the access token and refresh token.

### Register

- Endpoint: `/auth/register`
- Method: POST
- Description: Registers a new user.
- Request Body: `{ "username": "nhatthuba0510", "password": "Nh@tthuba0510", "email": "nhat051000@gmail.com", "first_name": "Nhat", "last_name": "Nguyen" }`
- Response: Returns a success message upon successful registration.

### Refresh Token

- Endpoint: `/auth/refresh`
- Method: POST
- Description: Refreshes the access token using the refresh token.
- Request Body: `{ "refresh_token": "your_refresh_token" }`
- Response: Returns a new access token.

### Logout

- Endpoint: `/auth/logout`
- Method: POST
- Description: Logs out the user and invalidates the access token.
- Response: Returns a success message upon successful logout.

## Conversation

### Get Conversations

- Endpoint: `/conversation`
- Method: GET
- Description: Retrieves a list of conversations.
- Response: Returns an array of conversation objects.

### Create Conversation

- Endpoint: `/conversation`
- Method: POST
- Description: Creates a new conversation.
- Request Body: `{ "participants": ["user1", "user2"] }`
- Response: Returns the created conversation object.

### Get Conversation by ID

- Endpoint: `/conversation/:id`
- Method: GET
- Description: Retrieves a specific conversation by its ID.
- Response: Returns the conversation object.

## Message

### Get Messages

- Endpoint: `/conversation/:id/message?page=yourpage&limit=20`
- Method: GET
- Description: Retrieves messages for a specific conversation with pagination.
- Response: Returns an array of message objects.

### Send Message

- Endpoint: `/conversation/:id/message`
- Method: POST
- Description: Sends a message to a specific conversation.
- Request Body: `{ "message": "hello!" }`
- Response: Returns the sent message object.

### Seen Message

- Endpoint: `/conversation/:id/message/seen`
- Method: POST
- Description: Marks a message as seen in a specific conversation.
- Response: Returns a success message upon marking the message as seen.

## Friend

### Get Friends

- Endpoint: `/friends`
- Method: GET
- Description: Retrieves a list of friends for the authenticated user.
- Response: Returns an array of friend objects.

### Send Friend Request

- Endpoint: `/friends/send-request`
- Method: POST
- Description: Sends a friend request to another user.
- Request Body: `{"accepted_user_id": "652e132128389a443dcec748", "requested_user_public_key": "thisismypublickey" }`
- Response: Returns a success message upon sending the friend request.

### Get Friend Requests

- Endpoint: `/friends/requests`
- Method: GET
- Description: Retrieves a list of pending friend requests for the authenticated user.
- Response: Returns an array of friend request objects.

### Accept Friend Request

- Endpoint: `/friends/accept-request`
- Method: POST
- Description: Accepts a pending friend request from another user.
- Request Body: `{ "requested_user_id": "652cc5335a13404d21b7614e", "accepted_user_public_key": "hereismypublickey" }`
- Response: Returns a success message upon accepting the friend request.

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
