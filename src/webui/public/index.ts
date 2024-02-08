import * as AutoR1 from '../../autor1';

const TEMPLATES = './templates.r2t';
const GROUP_NAME = 'AutoR1'
const SUFFIX = '_AUTO';

let templates: AutoR1.AutoR1TemplateFile;

/**
 * Prints a message to the terminal
 * @param message Message to print
 * @param newLine Whether to add a new line after the message
 */
const printToTerminal = (message: string, newLine = true, colour = 'black') => {
    const line = document.createElement(newLine ? 'div' : 'span');
    line.style.color = colour;
    line.innerHTML = message;
    terminal.appendChild(line);
}

/**
 * Creates a new path for the processed R1 project file
 * @param path
 * @returns New path
 */
const newAutoPath = (path: string) => path.substring(0, path.lastIndexOf('.')) + SUFFIX + '.dbpr';

/**
 * Downloads the processed file
 * @param projectFile
 * @param filename
 * @returns Download link
 */
const downloadFile = (projectFile: AutoR1.AutoR1ProjectFile, filename: string) => {
    const arraybuff = projectFile.db.export();

    var blob = new Blob([arraybuff]);
    const link = window.URL.createObjectURL(blob);

    var a = document.createElement("a");
    document.body.appendChild(a);
    a.href = link;
    a.download = filename;
    a.click();
    a.remove();

    return link
}

/**
 * Processes the selected file
 */
async function processFile() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    const selectedFile = fileInput.files![0]

    if (selectedFile) {

        const reader = new FileReader();
        reader.onload = async (event) => {
            const fileContent = event.target!.result! as ArrayBuffer; // This will be a ArrayBuffer

            // Convert the ArrayBuffer to a Uint8Array (Buffer-like)
            const buffer = new Uint8Array(fileContent);

            printToTerminal(`Loaded ${selectedFile.name}.`);

            let projectFile: AutoR1.AutoR1ProjectFile;
            try {
                projectFile = await AutoR1.AutoR1ProjectFile.build(Buffer.from(buffer));
            } catch (e) {
                printToTerminal(`Cannot process ${selectedFile.name}. Project file has not been initialised. Open the project in R1, run the initial setup and save before using AutoR1.`, true, 'darkred');
                return;
            }


            const existingGroupId = projectFile.getGroupIdFromName(GROUP_NAME);

            if (existingGroupId) {
                projectFile.clean(existingGroupId);
            }

            const parentId = projectFile.createGroup({ Name: GROUP_NAME });

            projectFile.createSubLRCGroups(parentId);
            projectFile.getSrcGrpInfo();
            projectFile.createAPGroup();
            projectFile.createMeterView(templates);
            projectFile.createMainView(templates);
            projectFile.createNavButtons(templates);
            projectFile.addSubCtoSubL();
            projectFile.createEqView(templates);

            const link = downloadFile(projectFile, newAutoPath(selectedFile.name));

            projectFile.close();

            // create a download link which automatically downloads the file
            printToTerminal(`Click <a href=${link} download style="font-weight: bold;">here<a> to download the processed file.`, false, 'darkblue');
        };

        reader.readAsArrayBuffer(selectedFile);
    }
}

fetch(TEMPLATES).then(response => {
    if (!response.ok) {
        printToTerminal(`Could not load templates.`);
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    response.arrayBuffer().then(async (arrayBuffer) => {
        const buffer = new Uint8Array(arrayBuffer)

        templates = await AutoR1.AutoR1TemplateFile.build(Buffer.from(buffer))

        printToTerminal('Templates loaded.');
    });
})

const terminal = document.getElementById('terminal')!;

(document.getElementById('processButton')! as HTMLButtonElement).onclick = processFile;

const dropArea = document.getElementById('app')!
dropArea.ondrop = (e) => {
    e.preventDefault();
    dropArea.style.border = '2px dashed #ccc';

    if (e.dataTransfer && e.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        [...e.dataTransfer!.items].forEach((item, i) => {
            // If dropped items aren't files, reject them
            if (item.kind === "file") {
                const file = item.getAsFile()!;
                (document.getElementById('fileInput')! as HTMLInputElement).files = e.dataTransfer!.files;
                console.log(`… file[${i}].name = ${file.name}`);
            }
        });
    } else {
        // Use DataTransfer interface to access the file(s)
        [...e.dataTransfer!.files].forEach((file, i) => {
            console.log(`… file[${i}].name = ${file.name}`);
        });
    }
};



// Event listeners for drag and drop
dropArea.ondragover = (e) => {
    e.preventDefault();
    dropArea.style.border = '2px dashed #007bff';
}

dropArea.ondragleave = () => {
    dropArea.style.border = '2px dashed #ccc';
}