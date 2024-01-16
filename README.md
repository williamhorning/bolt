# Bolt 0.5

Bolt is a cross-platform chat bot that bridges communities that's written in
Typescript and powered by Deno. To learn more, see the
[docs](https://williamhorning.dev/bolt/docs).

## Feature support matrix

|              | text  | threads | forums |
| ------------ | ----- | ------- | ------ |
| bolt         | ✓     | ✓       | X      |
| bolt-discord | ✓     | ✓       | ✓      |
| bolt-guilded | ✓\*   | X       | X      |
| bolt-matrix  | ✓\*\* | X       | X      |
| bolt-revolt  | ✓     | X       | X      |

\* bolt-guilded's text support doesn't fully support all the stuff other
platforms do  
\*\* bolt-matrix's implementation is barely functional and shouldn't be used,
mostly a POC
