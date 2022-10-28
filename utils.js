export function boltError(msg, productname, e) {
	console.log(`\x1b[41m${productname} Error:\x1b[0m`);
	console.log(e);
	if (process.env.ERROR_HOOK) {
		fetch(process.env.ERROR_HOOK, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				embeds: [
					{
						title: `${productname} Error`,
						description: `Error: ${msg} on ${productname}. \n \`\`\`${e}\`\`\``,
						color: 16711680,
					},
				],
			}),
		});
	}
	return {
		author: {
			username: "Bolt",
			icon_url:
				"https://cdn.discordapp.com/avatars/946939274434080849/fdcd9f72ed1f42e9ff99698a0cbf38fb.webp?size=128",
		},
		content: `Error: ${msg} on ${productname}. Run \`!bolt help\` to get help.`,
	};
}

export function boltErrorButExit(e) {
  boltError("uncaught exception", "bolt core", e);
  process.exit(1);
}