# Developing Bolt

Hey there! Thanks for being interested in developing Bolt! As a project, work is
mostly divided between a few different areas:

- `bolt` itself, sometimes refered to as `core`. This is where stuff like the
  Plugin API, bridge system, and CLI live.
- `bolt-dash`, the site you're currently on.
- First-party plugins like `bolt-discord`. These plugins are officially
  maintained and kept up to date as examples for other plugin and for use in the
  hosted version of Bolt.
- Contributing to upstream projects. As part of the work done in bolt or the
  first-party plugins, we sometimes need to have upstream dependencies add
  features that would also be useful to other people.

Some stuff, such as consistent styling, naming commits, running linters, and
making sure tests pass are shared among these projects. Others might have
additional or different rules as documented below.

## General guidelines

- Format your code using Prettier. Having consistent style across files helps
  keep the codebase nicer to navigate and the code easier to read. See
  [Editor Integration](https://prettier.io/docs/en/editors.html) if you want to
  use Prettier in your editor. We don't use Deno's `fmt` tool.
- Use Deno Lint to check for issues in your code. While manually checking your
  code should help you find errors or other issues, a linter can help make sure
  you catch these. See
  [this page](https://deno.land/manual@v1.39.4/tools/formatter) for more
  information.
- Follow the
  [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) and the
  [semver 2.0.0](https://semver.org/spec/v2.0.0.html) specs whenever reasonable
- Try to not introduce breaking changes- whether they're in the DB schema or
  plugin API- unless they're necessary.

## `bolt`

Bolt itself is where the majority of platform-independent code lives. This
module is further divided into three distinct areas:

- `cli`, the `bolt` command. This uses the `lib` and `migrations` libraries to
  provide users an easy way to run bolt from a shell.
- `lib`, the public api. This is where stuff like bridges, command system,
  Plugin API, and other programatic apis aside from `migrations` live.
- `migrations`, a library dealing with database migrations.

### General guidelines

- Prefix all exported types/classes/enums with `Bolt`
- Name all functions that are not on classes `<verb>Bolt<noun>` whenever
  reasonable
- If your functions require more than two arguments, use an object with
  destructuring.
- Document all changes in `changelog.md`

### `cli`

Generally, the CLI shouldn't need to have breaking changes made unless
funtionality from `lib` or `migrations`. This invites the question of "well,
what exactly is a breaking change in a CLI?" To that, there's not really much in
`cli` that can really be considered a breaking change except making an existing
use-case not work. This could be something as simple as renaming a command or
changing the output of something like `bolt --version` when other programs use
that.

### `lib`

`lib` is the part of Bolt where bridges, commands, and plugins are defined.
Breaking changes are any changes that would require change in any usage of the
exported items from `mod.ts`, whether those changes are requiring an object
instead of a string or removing a deprecated function. Try to keep breaking
changes to a minimum, especially if they impact the plugin system. If you do
make breaking changes to the plugin system, you should increment the
`boltversion` property. Ideally, we support two versions at a time-even if it
requires more code- to make upgrading versions easier.

### `migrations`

The `migrations` library exists to provide a programatic way to migrate data
passed to corresponding functions exported by it. There's not a lot of reason to
change stuff here so create an issue if you're considering something.

## First-party plugins

Follow the general guidelines on this page and those on the
[plugins](./plugins.md) page

## Upstream projects

Most of the time upstream projects should just work for us, but if we need a
feature that other people would find useful (such as Deno support), we should
contribute back to these projects. Follow the contributing guidelines of those
projects and any other documentation they might have.
