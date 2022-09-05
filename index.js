import { start } from "repl";
import "dotenv/config";
import { client } from "./class.js";

let thingy = new client();

await thingy.setup();

start({
	prompt: "bolt> ",
});
