# Commands

The prefix for all of these commands are `!bolt`. You may also be able to use
Discord slash commands or other platform-specific ways of running commands. If
there are square brackets around text that means that's an optional parameter
you can pass to that command. If there're surrounded by angle brackets that
means that parameter is required by that command.

## informational commands

### help

Links to this documentation site

### info

Shows some information about the instance of Bolt you're interacting with

### ping

A simple ping command that shows how long it takes Bolt to reply to you.

### site

Links to the landing page for the Bolt website

## bridge commands

### bridge status

Gets information about what bridge the current channel is in.

### bridge join <name>

Joins the bridge with the name provided.

When using Bolt 0.4.x, use `--bridge=<name>` instead.

### bridge reset [name]

Resets the current bridge with the name provided or the current bridges name.

This command isn't available in Bolt 0.4.x.

### bridge leave

Leaves the bridge the channel is currently in.
