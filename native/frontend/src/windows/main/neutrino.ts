import * as Neutralino from '@neutralinojs/lib';
import * as AutoR1 from '../../../../../src/autor1';

export const init = () => {
	setupAppClose();
};

const SUFFIX = '_AUTO';

const newAutoPath = (path: string) => path.substring(0, path.lastIndexOf('.')) + SUFFIX + '.dbpr';

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

export const downloadFile = (projectFile: AutoR1.AutoR1ProjectFile, filename: string) => {
	const arraybuff = projectFile.db.export();
	const autoPath = newAutoPath(filename);
	Neutralino.filesystem.writeBinaryFile(autoPath, arraybuff).then(
		() => {
			console.log(`Processed folder saved to ${autoPath}.`);
			alert(`Processed folder saved to ${autoPath}.`);
		},
		(rej) => {
			console.log(rej);
		}
	);
};

export const downloadTemplateFile = async (templates: AutoR1.AutoR1TemplateFile) => {
	const arraybuff = templates!.db.export();

	const path = (await Neutralino.os.getPath('downloads')) + '/templates.r2t';
	Neutralino.filesystem.writeBinaryFile(path, arraybuff).then(
		() => {
			alert(`templates.r2t saved to your Downloads folder.`);
		},
		(rej) => {
			console.log(rej);
		}
	);
};

export const openProjectDialog = () =>
	new Promise<File>((res) =>
		Neutralino.os.showOpenDialog('Select a file').then(async (entries) => {
			const [newFileName] = entries;
			const fileContent = await Neutralino.filesystem.readBinaryFile(newFileName);
			const file = new File([new Uint8Array(fileContent)], newFileName);
			return res(file);
		})
	);
