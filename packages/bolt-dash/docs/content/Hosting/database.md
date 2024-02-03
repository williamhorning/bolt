# Database

Bolt uses MongoDB to store long-term information such as bridge information and
Redis to store shorter-term data such as information about where messages were
sent to allow for editing.

## Setup

To configure your database, look at the `database` key in
[`config.ts`](./configure.md)

## Migrations

Database migrations allow you to move user data from one version of Bolt to
another. Bolt ships with an interactive CLI tool that'll help you migrate data
from one version of Bolt to another. Run `bolt migration` to get started.
