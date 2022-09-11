import { start } from "repl";
import "dotenv/config";
import { client } from "./class.js";

let thingy = new client();

await thingy.setup();

process.on("uncaughtException", (err) => {
	console.error(err);
});

process.on("unhandledRejection", (err) => {
	console.error(err);
});

start({
	prompt: "bolt> ",
});
