import type { message } from './deps.ts';

const chars = [
    '~',
    '#',
    '+',
    '-',
    '=',
    '{',
    '}',
    '.',
    '!',
];

export function from_lightning(msg: message) {
    let content = `${msg.author.username} » ${msg.content || '_no content_'}`;

    for (const char of chars) {
        content = content.replaceAll(char, `\\${char}`);
    }

    if (msg.embeds && msg.embeds.length > 0) {
        content += '\n_this message has embeds_';
    }

    const messages = [{
        function: 'sendMessage',
        value: content,
    }] as { function: 'sendMessage' | 'sendDocument'; value: string }[];

    for (const attachment of (msg.attachments ?? [])) {
        messages.push({
            function: 'sendDocument',
            value: attachment.file,
        });
    }

    return messages;
}
