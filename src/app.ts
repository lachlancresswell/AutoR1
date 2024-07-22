import Alpine from 'alpinejs';
import { Buffer } from 'buffer';
import * as AutoR1 from './autor1';

const TEMPLATES = '/templates.r2t';
const GROUP_NAME = 'AutoR1'
const SUFFIX = '_AUTO';

const DEFAULT_INPUT_GAIN_TYPE = AutoR1.INPUT_GAIN_TYPE.ANALOG;

let defaultTemplates: AutoR1.AutoR1TemplateFile;
let templates: AutoR1.AutoR1TemplateFile;

(window as any).VERSION = process.env.VERSION;
(window as any).COMMIT = process.env.COMMIT;

interface SourceGroupStatus {
    fallback: boolean;
    mute: boolean;
    ds: boolean;
    eq: boolean;
}

const DEFAULT_OPTIONS: AutoR1.ProjectOptions = Object.freeze({
    main: true,
    meter: true,
    eq: true,
    arraySightControls: true,
    inputGainType: DEFAULT_INPUT_GAIN_TYPE
});

interface AppData {
    projectFile: AutoR1.AutoR1ProjectFile | undefined;
    customTemplateFileName: string;
    fileName: string | undefined;
    sourceGroupsStatus: SourceGroupStatus[] | undefined;
    projectOptions: AutoR1.ProjectOptions;
    fileBuffer: Buffer | undefined;
    isVisible: boolean;
    clearFile: () => void;
    clearCustomTemplateFile: () => void;
}

const handleValueToggle = (val: boolean | number, ref: HTMLElement) => val ? ref.classList.add('bg-slate-200') : ref.classList.remove('bg-slate-200');

const newAutoPath = (path: string) => path.substring(0, path.lastIndexOf('.')) + SUFFIX + '.dbpr';

const newCleanPath = (path: string) => path.substring(0, path.lastIndexOf('.')) + 'CLEAN' + '.dbpr';

const downloadFile = (projectFile: AutoR1.AutoR1ProjectFile, filename: string) => {
    const arraybuff = projectFile.db.export();

    var blob = new Blob([arraybuff]);
    const link = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    document.body.appendChild(a);
    a.href = link;
    a.download = filename;
    a.click();
    a.remove();

    return link
}

const processFile = async (fileBuffer: Buffer, status: SourceGroupStatus[], options: AutoR1.ProjectOptions) => {
    let projectFile: AutoR1.AutoR1ProjectFile;
    projectFile = await AutoR1.AutoR1ProjectFile.build(fileBuffer!);

    if (projectFile.additions) {
        const id = projectFile.getGroupIdFromName(GROUP_NAME);
        projectFile.clean(id);
    }

    const parentId = projectFile.createGroup({ Name: GROUP_NAME });
    projectFile.createSubLRCGroups(parentId);
    projectFile.getSrcGrpInfo();

    status.forEach((row, i) => {
        projectFile.sourceGroups[i].fallback = row.fallback;
        projectFile.sourceGroups[i].mute = row.mute;
        projectFile.sourceGroups[i].dsData = row.ds;
        projectFile.sourceGroups[i].eq = row.eq;
    });

    options.inputGainType = parseInt(options.inputGainType as any) as 0 | 1;

    projectFile.createAll(templates, parentId!, options);

    return projectFile;
}

function base64ToArrayBuffer(base64: string) {
    var binaryString = atob(base64);
    var bytes = new Uint8Array(binaryString.length);
    for (var i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

Alpine.data<AppData, unknown[]>('app', () => ({
    projectFile: undefined,
    customTemplateFileName: '',
    isDragOver: false,
    fileName: undefined,
    sourceGroupsStatus: undefined,
    projectOptions: { ...DEFAULT_OPTIONS },
    fileBuffer: undefined,
    isVisible: false,

    init() {
        const arrayBuffer = base64ToArrayBuffer(templateBase64);

        const buffer = new Uint8Array(arrayBuffer)

        AutoR1.AutoR1TemplateFile.build(Buffer.from(buffer)).then((res) => {
            defaultTemplates = res;
            templates = res;
        })
    },

    toggleVisibility() {
        this.isVisible = !this.isVisible;
    },

    resetStatus() {
        if (this.projectFile) {
            this.sourceGroupsStatus = this.projectFile.sourceGroups.map(sg => ({ fallback: sg.fallback, mute: sg.mute, ds: sg.dsData, eq: sg.eq }));
        }
        this.projectOptions = { ...DEFAULT_OPTIONS };
        this.clearCustomTemplateFile();
    },

    async cleanFile() {
        if (this.fileBuffer) {
            const projectFile = await AutoR1.AutoR1ProjectFile.build(this.fileBuffer!);
            const id = projectFile.getGroupIdFromName(GROUP_NAME);
            projectFile.clean(id);

            downloadFile(projectFile, newCleanPath(this.fileName!));

            alert('Cleaned project has been downloaded.');
        }
    },

    clearFile() {
        this.projectFile = undefined;
        this.fileName = undefined;
        this.sourceGroupsStatus = undefined;
        this.fileBuffer = undefined;

        // Clear fileInput
        const fileInput = document.getElementById('fileInput')! as HTMLInputElement;
        fileInput.value = '';

        this.clearCustomTemplateFile();
    },

    statusHasChanged() {
        return this.sourceGroupsStatus?.some((row) => !row.fallback || !row.mute || !row.ds || !row.eq) ||
            !this.projectOptions.main ||
            !this.projectOptions.meter ||
            !this.projectOptions.eq ||
            !this.projectOptions.arraySightControls ||
            this.customTemplateFileName ||
            parseInt(this.projectOptions.inputGainType as any) !== DEFAULT_INPUT_GAIN_TYPE
    },

    toggleAllStatus(prop: 'fallback' | 'mute' | 'ds' | 'eq') {
        if (this.sourceGroupsStatus) {
            this.sourceGroupsStatus = this.sourceGroupsStatus.map(row => ({ ...row, [prop]: !row[prop] }));
        }
    },

    toggleRowStatus(index: number) {
        if (this.sourceGroupsStatus) {
            const row = this.sourceGroupsStatus[index];
            this.sourceGroupsStatus[index] = { fallback: !row.fallback, mute: !row.mute, ds: !row.ds, eq: !row.eq };
        }
    },

    async processFile() {
        if (this.fileBuffer) {
            const projectFile = await processFile(this.fileBuffer, this.sourceGroupsStatus!, this.projectOptions);

            downloadFile(projectFile, newAutoPath(this.fileName!));

            alert('Processed project has been downloaded.');
        }
    },

    handleDrop(event: DragEvent) {
        event.preventDefault();
        const droppedFile = event.dataTransfer ? event.dataTransfer.files[0] : (event.target as any).files[0];

        (document.getElementById('fileInput')! as HTMLInputElement).files = event.dataTransfer ? event.dataTransfer.files : (event.target as any).files;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const fileContent = event.target!.result! as ArrayBuffer;
            const buffer = new Uint8Array(fileContent);

            let projectFile: AutoR1.AutoR1ProjectFile;
            try {
                projectFile = await AutoR1.AutoR1ProjectFile.build(Buffer.from(buffer));
                if (projectFile.additions) {
                    const id = projectFile.getGroupIdFromName(GROUP_NAME);
                    if (!id) {
                        throw (new Error('Project has AutoR1 additions but the main group can not be found.'));
                    }
                    projectFile.clean(id);
                }
                const parentId = projectFile.createGroup({ Name: GROUP_NAME });
                projectFile.createSubLRCGroups(parentId);
                projectFile.getSrcGrpInfo();

                this.fileBuffer = Buffer.from(buffer);
                this.fileName = droppedFile.name;
                this.projectFile = projectFile;
                this.sourceGroupsStatus = projectFile.sourceGroups.map(sg => ({ fallback: sg.fallback, mute: sg.mute, ds: sg.dsData, eq: sg.eq }));
            } catch (e: any) {
                alert(`AutoR1 has encountered the following error while processing ${droppedFile.name}:\n${e}`)

                this.clearFile();
                return;
            }
        };

        reader.readAsArrayBuffer(droppedFile);
    },

    handleTemplateFileDrop(event: DragEvent) {
        event.preventDefault();
        debugger;
        const droppedFile = event.dataTransfer ? event.dataTransfer.files[0] : (event.target as any).files[0];

        (document.getElementById('templateInput')! as HTMLInputElement).files = event.dataTransfer ? event.dataTransfer.files : (event.target as any).files;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const fileContent = event.target!.result! as ArrayBuffer;
            const buffer = new Uint8Array(fileContent);

            try {
                templates = await AutoR1.AutoR1TemplateFile.build(Buffer.from(buffer))
                this.customTemplateFileName = droppedFile.name;
            } catch (e: any) {
                alert(`AutoR1 has encountered the following error while processing ${droppedFile.name}:\n${e}`)

                this.clearFile();
                return;
            }
        };

        reader.readAsArrayBuffer(droppedFile);
    },

    clearCustomTemplateFile() {
        templates = defaultTemplates;
        this.customTemplateFileName = '';
        const fileInput = document.getElementById('templateInput')! as HTMLInputElement;
        fileInput.value = '';
    },

    downloadTemplateFile() {
        const arraybuff = templates.db.export();

        var blob = new Blob([arraybuff]);
        const link = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        document.body.appendChild(a);
        a.href = link;
        a.download = 'templates.r2t';
        a.click();
        a.remove();

        return link
    }
}));
}));