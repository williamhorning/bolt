export default function parse(argstring) {
	let args = argstring.split(" ");
	args.shift();
	let returnData = {
		commands: [],
		arguments: {},
		commandString: '',
	};
	args.forEach((arg) => {
		let [argument, value] = arg.match(/([^=\s]+)=?\s*(.*)/).splice(1);
		if (argument.startsWith('--')) {
			if (!isNaN(parseFloat(value))) {
				value = parseFloat(value);
			} else if (value === 'true') {
				value = true;
			} else if (value === 'false') {
				value = false;
			} else if (value === '') {
				value = true;
			}
			returnData.arguments[argument.slice(2)] = value;
		} else {
			returnData.commands.push(argument);
		}
	});
	returnData.commandString = returnData.commands.join(' ');
	return returnData;
}
