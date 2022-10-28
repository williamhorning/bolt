import dedent from "string-dedent";

export function boltError(area, areadesc, prod, e) {
	return {
		author: {
			username: "Bolt",
			icon_url:
				"https://cdn.discordapp.com/avatars/946939274434080849/fdcd9f72ed1f42e9ff99698a0cbf38fb.webp?size=128",
		},
		content: dedent`
			bolt ran into an issue.
			here's some info:
			\`\`\`md
				# what you should do
				join the support server:
					- https://discord.gg/eGq7uhtJDx
					- https://www.guilded.gg/i/kamX0vek
					or
					- https://app.revolt.chat/invite/tpGKXcqk
				# details
				area: ${area} - ${areadesc}
				prod: ${prod}
				# error
				error: ${e?.message || e}
				stack trace:
				${e?.stack || e}
				legal:
				https://github.com/williamhorning/bolt/blob/main/legalese.md
			\`\`\`
		`,
	};
}
