import Alpine from 'alpinejs';
import { Buffer } from 'buffer';
import * as AutoR1 from './autor1';

const TEMPLATES = '/templates.r2t';
const GROUP_NAME = 'AutoR1'
const SUFFIX = '_AUTO';

const DEFAULT_INPUT_GAIN_TYPE = AutoR1.INPUT_GAIN_TYPE.ANALOG;

let templates: AutoR1.AutoR1TemplateFile;

(window as any).VERSION = process.env.VERSION;
(window as any).COMMIT = process.env.COMMIT;

interface SourceGroupStatus {
    fallback: boolean;
    mute: boolean;
    ds: boolean;
}

const DEFAULT_OPTIONS: AutoR1.ProjectOptions = {
    main: true,
    meter: true,
    eq: true,
    arraySightControls: true,
    inputGainType: DEFAULT_INPUT_GAIN_TYPE
}

interface AppData {
    projectFile: AutoR1.AutoR1ProjectFile | undefined;
    fileName: string | undefined;
    sourceGroupsStatus: SourceGroupStatus[] | undefined;
    projectOptions: AutoR1.ProjectOptions;
    fileBuffer: Buffer | undefined;
    isVisible: boolean;
    clearFile: () => void;
}

const newAutoPath = (path: string) => path.substring(0, path.lastIndexOf('.')) + SUFFIX + '.dbpr';

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
    });

    options.inputGainType = parseInt(options.inputGainType as any) as 0 | 1;

    projectFile.createAll(templates, parentId!, options);

    return projectFile;
}

Alpine.data<AppData, unknown[]>('app', () => ({
    projectFile: undefined,
    isDragOver: false,
    fileName: undefined,
    sourceGroupsStatus: undefined,
    projectOptions: DEFAULT_OPTIONS,
    fileBuffer: undefined,
    isVisible: true,

    init() {
        fetch(TEMPLATES).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            response.arrayBuffer().then(async (arrayBuffer) => {
                const buffer = new Uint8Array(arrayBuffer)

                templates = await AutoR1.AutoR1TemplateFile.build(Buffer.from(buffer))
            });
        })
    },

    toggleVisibility() {
        this.isVisible = !this.isVisible;
    },

    resetStatus() {
        if (this.projectFile) {
            this.sourceGroupsStatus = this.projectFile.sourceGroups.map(sg => ({ fallback: sg.fallback, mute: sg.mute, ds: sg.dsData }));
        }
        this.projectOptions = DEFAULT_OPTIONS;
    },

    cleanFile() {
        if (this.projectFile) {
            const id = this.projectFile.getGroupIdFromName(GROUP_NAME);
            this.projectFile.clean(id);
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
    },

    statusHasChanged() {
        return this.sourceGroupsStatus?.some((row) => !row.fallback || !row.mute || !row.ds) ||
            !this.projectOptions.main ||
            !this.projectOptions.meter ||
            !this.projectOptions.eq ||
            !this.projectOptions.arraySightControls ||
            parseInt(this.projectOptions.inputGainType as any) !== DEFAULT_INPUT_GAIN_TYPE
    },

    toggleAllStatus(prop: 'fallback' | 'mute' | 'ds') {
        if (this.sourceGroupsStatus) {
            this.sourceGroupsStatus = this.sourceGroupsStatus.map(row => ({ ...row, [prop]: !row[prop] }));
        }
    },

    toggleRowStatus(index: number) {
        if (this.sourceGroupsStatus) {
            const row = this.sourceGroupsStatus[index];
            this.sourceGroupsStatus[index] = { fallback: !row.fallback, mute: !row.mute, ds: !row.ds };
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
        console.log('handledrop')
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
                this.sourceGroupsStatus = projectFile.sourceGroups.map(sg => ({ fallback: sg.fallback, mute: sg.mute, ds: sg.dsData }));
            } catch (e: any) {
                alert(`AutoR1 has encountered the following error while processing ${droppedFile.name}:\n${e}`)

                this.clearFile();
                return;
            }
        };

        reader.readAsArrayBuffer(droppedFile);
    },
}));