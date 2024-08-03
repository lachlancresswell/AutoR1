import * as Neutralino from '@neutralinojs/lib';

export const init = () => {
	setupAppClose();
};

// This function should be called when your app initializes
function setupAppClose() {
	if (window.NL_OS === 'Darwin') {
		// macOS
		window.addEventListener('keydown', (event) => {
			const wasCommandUsed = event.metaKey === true; // was command held
			if (wasCommandUsed) {
				switch (event.which) {
					case 81: // q
					case 87: // w
						return Neutralino.app.exit();
				}
			}
		});
	}
}

export const alert = (msg: string, title = 'AutoR1') => Neutralino.os.showNotification(title, msg);

export const openSaveDialog = () =>
	new Promise<string>((res) =>
		Neutralino.os
			.showSaveDialog('Select a file', { defaultPath: 'templates.r2t' })
			.then(async (entries) => {
				console.log(entries);
				const [newPath] = entries;
				return res(newPath);
			})
	);

export const downloadFile = (arraybuff: Uint8Array, filename: string) =>
	Neutralino.filesystem.writeBinaryFile(filename, arraybuff).then(
		() => {
			console.log(`Processed folder saved to ${filename}.`);
			alert(`Processed folder saved to ${filename}.`);
		},
		(rej) => {
			console.log(rej);
		}
	);

export const openProjectDialog = () =>
	new Promise<File>((res) =>
		Neutralino.os.showOpenDialog('Select a file').then(async (entries) => {
			const [newFileName] = entries;
			const fileContent = await Neutralino.filesystem.readBinaryFile(newFileName);
			const file = new File([new Uint8Array(fileContent)], newFileName);
			return res(file);
		})
	);
