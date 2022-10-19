import { start } from "repl";
import "dotenv/config";
import { client } from "./class.js";

globalThis.thingy = new client();

start({
	prompt: "bolt> ",
});
