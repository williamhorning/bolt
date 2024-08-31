import type { Client } from '@jersey/rvapi';
import type {
	Channel,
	Member,
	Role,
	Server,
} from '@jersey/revolt-api-types';

export async function revolt_perms(
	client: Client,
	channel: string,
	self_id: string,
) {
	const ch = await client.request(
		'get',
		`/channels/${channel}`,
		undefined,
	) as Channel;

	const permissions_to_check = [
		1 << 23, // ManageMessages
		1 << 28, // Masquerade
	];

	// see https://developers.revolt.chat/assets/api/Permission%20Hierarchy.svg
	const permissions = permissions_to_check.reduce((a, b) => a | b, 0);

	if (ch.channel_type === 'Group') {
		if (ch.permissions && ch.permissions & permissions) return channel;
	} else if (ch.channel_type === 'TextChannel') {
		const srvr = await client.request(
			'get',
			`/servers/${ch.server}`,
			undefined,
		) as Server;

		const member = await client.request(
			'get',
			`/servers/${ch.server}/members/${self_id}`,
			undefined,
		) as Member;

		// check server permissions
		let perms = srvr.default_permissions;

		for (const role of (member.roles || [])) {
			const { permissions: role_perms } = await client.request(
				'get',
				`/servers/${ch.server}/roles/${role}`,
				undefined,
			) as Role;

			perms |= role_perms.a || 0;
			perms &= ~role_perms.d || 0;
		}

		// apply default allow/denies
		if (ch.default_permissions) {
			perms |= ch.default_permissions.a;
			perms &= ~ch.default_permissions.d;
		}

		// apply role permissions
		if (ch.role_permissions) {
			for (const role of (member.roles || [])) {
				perms |= ch.role_permissions[role]?.a || 0;
				perms &= ~ch.role_permissions[role]?.d || 0;
			}
		}

		// check permissions
		if (perms & permissions) return channel;
	} else {
		throw new Error(`Unsupported channel type: ${ch.channel_type}`);
	}

	throw new Error(
		'Insufficient permissions! Please enable ManageMessages and Masquerade permissions.',
	);
}
