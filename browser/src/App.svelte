<script lang="ts">
	import { onMount } from 'svelte';
	import { Buffer } from 'buffer'
	import * as AutoR1 from '@autor1/lib';
	import * as dbpr from '../../lib/src/dbpr';
	import * as Neutralino from '@neutralinojs/lib';
	import type { PageConfig } from '../../lib/src/ViewTemplateManager';
	import {
	handleViewConfig,
} from '../../lib/src/viewTemplates';
	import {
		downloadFile,
		init,
		alert,
		openProjectDialog,
	} from '../../native/frontend/src/windows/main/neutrino';

	const GROUP_NAME = 'AutoR1';
	const SUFFIX = '_AUTO';

	const newAutoPath = (path: string) => path.substring(0, path.lastIndexOf('.')) + SUFFIX + '.dbpr';

	const versionString = (window as any).NL_APPVERSION || '-2';
	const commitString = (window as any).NL_COMMIT
		? (window as any as { NL_COMMIT: string }).NL_COMMIT.substring(
				(window as any as { NL_COMMIT: string }).NL_COMMIT.length - 5
			) + (window as any).NL_CCOMMIT?.substring((window as any).NL_CCOMMIT.length - 5)
		: '-1';

	const DEFAULT_OPTIONS: AutoR1.ProjectOptions = {
		main: true,
		meter: true,
		eq: true,
		arraySightControls: true
	};

	let defaultTemplateFile: AutoR1.AutoR1TemplateFile | undefined = $state();
	let templateFile: AutoR1.AutoR1TemplateFile | undefined = $state();

	let projectFile: AutoR1.AutoR1ProjectFile | undefined = $state();
	let projectFileBuffer: Buffer | undefined = $state();
	let projectOptions: AutoR1.ProjectOptions = $state({ ...DEFAULT_OPTIONS });
	let fileName: string = $state('');
	let customTemplateFileName = $state('');
	let sourceGroupsStatus: SourceGroupStatus[] | undefined = $state();
	let isVisible = $state(false);

	interface SourceGroupStatus {
		fallback: boolean;
		mute: boolean;
		ds: boolean;
		eq: boolean;
	}

	onMount(async () => {
		init();

		const arrayBuffer = await Neutralino.filesystem.readBinaryFile('../lib/Projects/templates.r2t');
		const buffer = new Uint8Array(arrayBuffer);
		defaultTemplateFile = await AutoR1.AutoR1TemplateFile.build(Buffer.from(buffer));
		templateFile = defaultTemplateFile;
	});

	function base64ToArrayBuffer(base64: string) {
		var binaryString = atob(base64);
		var bytes = new Uint8Array(binaryString.length);
		for (var i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}
		return bytes.buffer;
	}

	function toggleVisibility() {
		isVisible = !isVisible;
	}

	const newCleanPath = (path: string) =>
		path.substring(0, path.lastIndexOf('.')) + 'CLEAN' + '.dbpr';

	function resetStatus() {
		if (projectFile) {
			sourceGroupsStatus = projectFile.sourceGroups.map((sg) => ({
				fallback: sg.fallback,
				mute: sg.mute,
				ds: sg.dsData,
				eq: sg.eq
			}));
		}
		projectOptions = { ...DEFAULT_OPTIONS };
		clearCustomTemplateFile();
	}

	async function cleanFile() {
		if (projectFileBuffer) {
			const projectFile = await AutoR1.AutoR1ProjectFile.build(projectFileBuffer);
			const id = projectFile.getGroupIdFromName(GROUP_NAME);
			projectFile.clean(id);

			const arraybuff = projectFile.db.export();

			downloadFile(arraybuff, newCleanPath(fileName!));

			alert('Cleaned project has been downloaded.');
		}
	}

	function clearFile() {
		projectFile = undefined;
		fileName = '';
		sourceGroupsStatus = undefined;
		projectFileBuffer = undefined;

		clearCustomTemplateFile();
	}

	const processFile = async (
		fileBuffer: Buffer,
		status: SourceGroupStatus[],
		options: AutoR1.ProjectOptions
	) => {
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

		projectFile.createAPGroup();
		projectFile.createMainFallbackGroup();
		projectFile.createMainEqGroup();
		projectFile.createMainDsGroup();
		projectFile.createMainMuteGroup();

		const config: PageConfig[] = [
			{
				// New view
				name: 'Auto Main',
				templates: [
					{
						name: AutoR1.AutoR1TemplateTitles.MAIN_TITLE,
						initialPosition: { x: 10, y: 10 }
					},
					{
						name: AutoR1.AutoR1TemplateTitles.MAIN_OVERVIEW,
						type: 'Master',
						initialPosition: { x: 10, y: 67 }
					},
					{
						name: AutoR1.AutoR1TemplateTitles.MAIN_FALLBACK,
						type: 'Fallback',
						initialPosition: { x: 10, y: 266 }
					},
					{
						name: AutoR1.AutoR1TemplateTitles.MAIN_DS10,
						type: 'DS',
						initialPosition: { x: 238, y: 266 }
					},
					{
						name: AutoR1.AutoR1TemplateTitles.THC,
						type: 'AP',
						initialPosition: { x: 238, y: 67 }
					},
					{
						name: AutoR1.AutoR1TemplateTitles.GROUP,
						type: 'BandPassGroup',
						initialPosition: { x: 482, y: 173 },
						propagation: {
							direction: 'horizontal',
							spacing: 10
						}
					}
				],
				controls: [
					{
						Type: dbpr.ControlTypes.SWITCH,
						DisplayName: 'Mute',
						Width: 76,
						Height: 24,
						TargetType: dbpr.TargetTypes.GROUP,
						Target: 'Mute',
						Property: 'Mute',
						Flag: 'Toggle',
						MainColor: 12,
						initialPosition: { x: 145, y: 160 }
					}
				]
			},
			{
				// New view
				name: 'Auto Meters',
				templates: [
					{
						name: AutoR1.AutoR1TemplateTitles.METERS_TITLE,
						initialPosition: { x: 10, y: 10 }
					},
					{
						name: AutoR1.AutoR1TemplateTitles.METERS_GROUP,
						type: 'ChannelGroup',
						initialPosition: { x: 10, y: 67 },
						propagation: {
							direction: 'horizontal',
							spacing: 10
						},
						children: [
							{
								name: AutoR1.AutoR1TemplateTitles.METER,
								type: 'Channel',
								relativePosition: { x: 0, y: 0 },
								propagation: {
									direction: 'vertical',
									spacing: 10
								}
							}
						]
					}
				]
			},
			{
				name: 'Auto EQ',
				templates: [
					{
						name: AutoR1.AutoR1TemplateTitles.EQ1_TITLE,
						initialPosition: { x: 10, y: 10 }
					},
					{
						name: AutoR1.AutoR1TemplateTitles.EQ1,
						type: 'BandPassGroup',
						initialPosition: { x: 10, y: 67 },
						propagation: {
							direction: 'horizontal',
							spacing: 10,
							itemLimit: 2
						}
					},
					{
						name: AutoR1.AutoR1TemplateTitles.EQ2_TITLE,
						initialPosition: { x: 1180, y: 10 }
					},
					{
						name: AutoR1.AutoR1TemplateTitles.EQ2,
						type: 'BandPassGroup',
						initialPosition: { x: 1180, y: 67 },
						propagation: {
							direction: 'horizontal',
							spacing: 10,
							itemLimit: 2
						}
					}
				],
				controls: [
					{
						Type: dbpr.ControlTypes.EQ,
						type: 'Master',
						DisplayName: 'THRUST',
						Width: 554,
						Height: 426,
						TargetType: dbpr.TargetTypes.GROUP,
						Target: 'Master',
						Property: 'EQ1',
						LabelAlignment: 64,
						initialPosition: { x: 10, y: 67 }
					}
				]
			},
			{
				// All current views
				paddingY: 30,
				initialPosition: { x: 10, y: 20 },
				controls: [
					{
						Type: dbpr.ControlTypes.SWITCH,
						DisplayName: 'Auto Main',
						Width: 140,
						Height: 25,
						TargetType: dbpr.TargetTypes.VIEW,
						Target: 'Auto Main',
						Property: 'Page',
						propagation: {
							direction: 'horizontal',
							spacing: 10
						},
						initialPosition: { x: 0, y: 10 }
					},
					{
						Type: dbpr.ControlTypes.SWITCH,
						DisplayName: 'Auto Meters',
						Width: 140,
						Height: 25,
						TargetType: dbpr.TargetTypes.VIEW,
						Target: 'Auto Meters',
						Property: 'Page',
						propagation: {
							direction: 'horizontal',
							spacing: 10
						},
						initialPosition: { x: 0, y: 10 }
					},
					{
						Type: dbpr.ControlTypes.SWITCH,
						DisplayName: 'Auto EQ',
						Width: 140,
						Height: 25,
						TargetType: dbpr.TargetTypes.VIEW,
						Target: 'Auto EQ',
						Property: 'Page',
						propagation: {
							direction: 'horizontal',
							spacing: 10
						},
						initialPosition: { x: 0, y: 10 }
					}
				]
			}
		];

		config.forEach((view) => handleViewConfig(view, projectFile, templateFile!));

		const arraybuff = projectFile.db.export();

		downloadFile(arraybuff, newAutoPath(fileName));

		return projectFile;
	};

	function handleDrop(event: Event) {
		const [file] = (event.target as HTMLInputElement).files!;
		loadProjectFile(file).then((loadedfile) => projectFile = loadedfile)
	}

	function handleTemplateFileDrop(event: Event) {
		const [file] = (event.target as HTMLInputElement).files!;
		loadTemplateFile(file);
	}

	const toggleAllStatus = (prop: 'fallback' | 'mute' | 'ds' | 'eq') => {
		if (sourceGroupsStatus) {
			sourceGroupsStatus = sourceGroupsStatus.map((row) => ({
				...row,
				[prop]: !row[prop]
			}));
		}
	};

	const toggleRowStatus = (index: number) => {
		if (sourceGroupsStatus) {
			const row = sourceGroupsStatus[index];
			sourceGroupsStatus[index] = {
				fallback: !row.fallback,
				mute: !row.mute,
				ds: !row.ds,
				eq: !row.eq
			};
		}
	};

	function statusHasChanged() {
		return (
			sourceGroupsStatus?.some((row) => !row.fallback || !row.mute || !row.ds || !row.eq) ||
			!projectOptions.main ||
			!projectOptions.meter ||
			!projectOptions.eq ||
			!projectOptions.arraySightControls ||
			customTemplateFileName
		);
	}

	const loadDbpr = (droppedFile: File) =>
		new Promise<Buffer>((res) => {
			const reader = new FileReader();
			reader.onload = async (event) => {
				const fileContent = event.target!.result! as ArrayBuffer;
				const buffer = Buffer.from(new Uint8Array(fileContent));

				res(buffer);
			};
			reader.readAsArrayBuffer(droppedFile);
		});

	const loadProjectFile = async (droppedFile: File) => {
		const buffer = await loadDbpr(droppedFile);
		let newProjectFile: AutoR1.AutoR1ProjectFile;
		newProjectFile = await AutoR1.AutoR1ProjectFile.build(buffer);
		if (newProjectFile.additions) {
			const id = newProjectFile.getGroupIdFromName(GROUP_NAME);
			if (!id) {
				throw new Error('Project has AutoR1 additions but the main group can not be found.');
			}
			newProjectFile.clean(id);
		}
		const parentId = newProjectFile.createGroup({
			Name: GROUP_NAME
		});
		newProjectFile.createSubLRCGroups(parentId);
		newProjectFile.getSrcGrpInfo();

		projectFileBuffer = buffer;
		fileName = droppedFile!.name;
		sourceGroupsStatus = newProjectFile.sourceGroups.map((sg) => ({
			fallback: sg.fallback,
			mute: sg.mute,
			ds: sg.dsData,
			eq: sg.eq
		}));

		return newProjectFile;
	};

	const loadTemplateFile = async (droppedFile: File) => {
		const buffer = await loadDbpr(droppedFile);
		let newTemplateFile = await AutoR1.AutoR1TemplateFile.build(buffer);
		return newTemplateFile;
	};

	const handleTemplateFileClick = async () => {
		const file = await openProjectDialog();

		try {
			templateFile = await loadTemplateFile(file);
			customTemplateFileName = file.name.split('/')[file.name.split('/').length - 1];
		} catch (e) {
			console.log(e);
			alert('Failed to load template file.');
		}
	};

	const clearCustomTemplateFile = () => {
		templateFile = defaultTemplateFile;
		customTemplateFileName = '';
	};

	const handleTemplateFileDownload = () => {
		const arraybuff = templateFile!.db.export();
		downloadFile(arraybuff, './templates.r2t')
	};

	const handleInputClick = async () => {
		const file = await openProjectDialog();
		try {
			projectFile = await loadProjectFile(file);
		} catch (e: any) {
			alert(`AutoR1 has encountered the following error while processing ${file.name}:\n${e}`);

			clearFile();
			return;
		}
	};
</script>

<main
	class="flex h-full select-none flex-col justify-center bg-white font-mono text-zinc-800 dark:bg-zinc-800 dark:text-zinc-50"
>
	<div class="mx-auto flex max-w-lg flex-col items-center">
		<div class="my-5 flex w-max flex-col items-center">
			<h1 class="text-4xl font-bold">AutoR1 2.0 Beta</h1>
		</div>

		{#if !projectFile}
			<div class="flex w-max flex-col items-center">
				<div class="relative">
					<input
						class="absolute inset-0 z-50 m-0 h-full w-full cursor-pointer p-1 opacity-0 outline-none"
						type="file"
						id="fileInput"
						accept=".dbpr"
						onchange={handleDrop}
					/>
					<div
						class="flex h-48 cursor-pointer items-center justify-center border-2 border-solid border-slate-700 hover:border-slate-400"
					>
						<div>Click to load a .DBPR file or drag and drop.</div>
					</div>
				</div>
			</div>
		{/if}

		{#if projectFile}
			<div class="flex w-full flex-col items-center px-3">
				<div class="my-5 flex flex-col items-center">
					<h1 class="text-center text-4xl font-bold">
						{fileName.split('/')[fileName.split('/').length - 1]}
					</h1>
				</div>
				<div>
					<p>Initial setup performed: ✅</p>
					{#if projectFile.additions}
						<p>Already contains AutoR1 additions: <span>✅</span></p>
					{/if}
				</div>
				<div class="w-full">
					<div class="text-med my-2 flex h-8 justify-around gap-x-2">
						<button
							class="flex-grow-1 basis-1/4 rounded-md bg-lime-500"
							style="flex-grow: 1;"
							onclick={() => processFile(projectFileBuffer!, sourceGroupsStatus!, projectOptions)}
						>
							<span style="margin-right: 0.4vw;">▶️</span><span>Run</span>
						</button>
						{#if projectFile.additions}
							<button
								class="basis-1/4 rounded-md bg-slate-200"
								style="flex-grow: 1;"
								onclick={cleanFile}
							>
								<span style="margin-right: 0.4vw;">🧹</span><span>Clean</span>
							</button>
						{/if}
						<button
							class="basis-1/4 rounded-md bg-slate-200"
							style="flex-grow: 1;"
							onclick={clearFile}
						>
							<span style="margin-right: 0.4vw;">⏮️</span><span>Clear</span>
						</button>
						<button
							class="basis-1/4 rounded-md bg-slate-200"
							style="flex-grow: 1;"
							onclick={toggleVisibility}
						>
							<span style="margin-right: 0.4vw;">{isVisible ? '⤴️' : '⤵️'}</span>
							<span>{isVisible ? 'Hide' : 'Show'}</span>
						</button>
						{#if isVisible && statusHasChanged()}
							<button
								class="basis-1/4 rounded-md bg-slate-200"
								style="flex-grow: 1;"
								onclick={resetStatus}
							>
								<span style="margin-right: 0.4vw;">⏪</span><span>Reset</span>
							</button>
						{/if}
					</div>
					{#if isVisible}
						<div class="flex flex-col items-center">
							<div class="w-full">
								<div class="flex justify-end">
									<div class="w-fit basis-2/3">Main page</div>
									<input class="basis-1/3" type="checkbox" bind:checked={projectOptions.main} />
								</div>
								<div class="flex justify-end">
									<div class="w-fit basis-2/3">Meter page</div>
									<input class="basis-1/3" type="checkbox" bind:checked={projectOptions.meter} />
								</div>
								<div class="flex justify-end">
									<div class="w-fit basis-2/3">EQ page</div>
									<input class="basis-1/3" type="checkbox" bind:checked={projectOptions.eq} />
								</div>
								<div class="flex justify-end">
									<div class="w-fit basis-2/3">ArraySight controls</div>
									<input
										class="basis-1/3"
										type="checkbox"
										bind:checked={projectOptions.arraySightControls}
									/>
								</div>
								<div class="flex justify-between gap-1" title="Load a custom .r2t template file.">
									<div class="w-fit basis-1/2">Custom templates:</div>
									{#if !customTemplateFileName}
										<input type="file" id="templateInput" class="hidden" accept=".r2t" />
										<button
											class="w-full basis-1/4 cursor-pointer rounded-md bg-slate-200 text-center"
											onchange={handleTemplateFileDrop}
											onclick={handleTemplateFileClick}
										>
											Load
										</button>
										<button
											class="w-full basis-1/4 cursor-pointer rounded-md bg-slate-200 text-center"
											onclick={handleTemplateFileDownload}
										>
											Get
										</button>
									{:else}
										<button
											class="w-full basis-1/2 cursor-pointer rounded-md bg-slate-200 text-center"
											onclick={clearCustomTemplateFile}
										>
											<span class="text-xs">{customTemplateFileName}</span>
											<span>❌</span>
										</button>
									{/if}
								</div>
							</div>
							<table id="sourceGroupTable" class="w-full text-center">
								<thead>
									<tr>
										<th>Source Group</th>
										<th class="cursor-pointer" onclick={() => toggleAllStatus('fallback')}
											>Fallback</th
										>
										<th class="cursor-pointer" onclick={() => toggleAllStatus('mute')}>Mute</th>
										<th class="cursor-pointer" onclick={() => toggleAllStatus('ds')}>DS Data</th>
									</tr>
								</thead>
								<tbody>
									{#each sourceGroupsStatus! as row, index}
										<tr>
											<td class="cursor-pointer" onclick={() => toggleRowStatus(index)}>
												{projectFile?.sourceGroups?.[index]?.Name}
											</td>
											<td><input type="checkbox" bind:checked={row.fallback} /></td>
											<td><input type="checkbox" bind:checked={row.mute} /></td>
											<td><input type="checkbox" bind:checked={row.ds} /></td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			</div>
		{/if}
		{#if !(window as any).NL_APPVERSION}
			<div class="my-4 text-center text-sm">
				All files are processed on-device and are not uploaded or stored remotely. An internet
				connection is not required once the page has loaded.
			</div>
		{/if}
		<div class="mb-3 mt-3 flex flex-col items-center">
			<div class="mb-3 p-2 hover:rounded-md hover:bg-slate-400">
				<a class="text-sm" href="https://discord.gg/xWMcNGc4FF">
					<img
						class="mr-2 inline"
						width="25rem"
						src="https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/653714c174fc6c8bbea73caf_636e0a69f118df70ad7828d4_icon_clyde_blurple_RGB.svg"
						alt="Discord logo"
					/>Join the Discord</a
				>
			</div>
			<div style="height:3em;width:10em;">
				<a href=" https://www.buymeacoffee.com/Lachlanc"
					><img
						alt="Buy my a coffee donation button"
						src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=Lachlanc&button_colour=FFDD00&font_colour=000000&font_family=Inter&outline_colour=000000&coffee_colour=ffffff"
					/></a
				>
			</div>
		</div>
		<div style="font-size: 0.5em;">
			<span>Created by Lachlan Cresswell.</span>
			<span>v{versionString}-{commitString}</span>-<span> </span>
		</div>
	</div>
</main>
