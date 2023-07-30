export function isChannel(channel: string) {
	if (
		channel.match(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
		)
	)
		return true;
	if (channel.match(/[0-7][0-9A-HJKMNP-TV-Z]{25}/gm)) return true;
	if (!isNaN(Number(channel))) return true;
	if (
		channel.startsWith('discord-') ||
		channel.startsWith('guilded-') ||
		channel.startsWith('revolt-')
	)
		return true;
	return false;
}

export function mapPlugins(pluginname: string): string {
	if (pluginname === 'discord') return 'bolt-discord';
	if (pluginname === 'guilded') return 'bolt-guilded';
	if (pluginname === 'revolt') return 'bolt-revolt';
	return 'unknown';
}
