# Week 0 Deliverable – Environment Setup

## Overview

This week focused on setting up the local OpenClaw development environment and verifying that the agent can connect to the required database, model provider, and WhatsApp channel.

## 1. Repository & Node Setup

- Cloned the OpenClaw repository
- Installed project dependencies
- Configured the local Node.js environment
- Verified that the OpenClaw runtime starts successfully

## 2. MySQL Database Import

Successfully imported the IDX Exchange datasets into a local MySQL database.

Verified tables:

- `california_sold`
- `rets_openhouse`
- `rets_property`

## 3. Environment Variables

Configured required local environment variables in `.env`.

Included:

- `OPENAI_API_KEY`
- `MYSQL_HOST`
- `MYSQL_USER`
- `MYSQL_DATABASE`
- `EMAIL_USER`
- `EMAIL_PASSWORD`
- WhatsApp channel credentials

Sensitive values were kept out of GitHub.

## 4. OpenAI API Configuration

Generated a personal OpenAI API key and connected it to OpenClaw.

Verified that the agent can authenticate with the model provider and generate responses.

## 5. WhatsApp Integration

Linked WhatsApp to OpenClaw through the local channel setup.

Verified:

- OpenClaw can send outbound WhatsApp messages
- OpenClaw can receive inbound WhatsApp messages
- The WhatsApp channel remains connected through the local runtime

## Evidence

A screenshot of the WhatsApp integration test is included in this folder:

`whatsapp.jpg`

## Summary

By the end of Week 0, the local environment was ready for future development. OpenClaw was installed, the MySQL database was imported, API credentials were configured, and WhatsApp messaging was successfully tested.

