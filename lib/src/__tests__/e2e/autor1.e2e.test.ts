/**
 * Tests here operate on project files on disk.
 */
import { AutoR1ProjectFile, AutoR1TemplateFile, AutoR1TemplateTitles } from '../../autor1';
import * as dbpr from '../../dbpr';
import { PROJECT_INIT_AP, TEMPLATES, cleanupTest, setupTest } from '../setupTests';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import * as fs from 'fs';
import {
	Assign,
	autoMetersTemplate,
	createViewFromTemplate,
	handleViewConfig,
	Position,
	ViewTemplate
} from '../../viewTemplates';
import { exec } from 'child_process';

import { PageConfig } from '../../ViewTemplateManager';

import { config } from '../../defaultViews';

enum Positions {
	// Frame surrounding meter
	MAIN_METERS_FRAME_X = 483,
	MAIN_METERS_FRAME_Y = 117,
	// Meter itself
	MAIN_METERS_METER_Y = 156,
	// Mute buttons within meter
	MAIN_METERS_MUTE_Y = 453
}

describe('pageTemplates', () => {
	let projectFile: AutoR1ProjectFile;
	let templateFile: AutoR1TemplateFile;
	let parentId: number;
	let fileId: number;

	beforeEach(async () => {
		fileId = setupTest();

		const projectFileBuffer = fs.readFileSync(PROJECT_INIT_AP + fileId);
		const templateFileBuffer = fs.readFileSync(TEMPLATES + fileId);
		projectFile = await AutoR1ProjectFile.build(projectFileBuffer);
		templateFile = await AutoR1TemplateFile.build(templateFileBuffer);
		parentId = projectFile.createGroup({ Name: 'Auto R1' });
		projectFile.createSubLRCGroups(parentId);
		projectFile.getSrcGrpInfo();
		projectFile.createAPGroup(parentId);
		projectFile.createMainFallbackGroup(parentId);
		projectFile.createMainEqGroup(parentId);
		projectFile.createMainDsGroup(parentId);
		projectFile.createMainMuteGroup(parentId);
	});

	afterEach(() => {
		const arraybuff = projectFile.db.export();

		fs.writeFileSync('testoutput.dbpr', arraybuff);
		const cmd = `pkill -f "R1 V3" & sleep 2 && osascript -e 'tell application "R1 V3" to open POSIX file "${__dirname + '/../../../../testoutput.dbpr'}"' && sleep 1 && osascript -e 'tell application "System Events" to tell process "R1 V3" to set visible to false'`;
		exec(cmd);

		templateFile.close();
		cleanupTest(fileId);
	});

	it('should create the meter view', () => {
		const viewTemplate: ViewTemplate = {
			'Auto Meters': {
				startX: 1,
				startY: 1,
				paddingX: 10,
				paddingY: 10,
				insideOut: false,
				templates: [
					{
						title: 'Meters Title',
						x: 1,
						y: Position.ADVANCE_NEXT
					},
					{
						title: 'Meters Group',
						x: Position.ADVANCE_NEXT,
						y: Position.PREVIOUS,
						assign: Assign.CHANNELGROUPS,
						templates: [
							{
								title: 'Meter',
								assign: Assign.CHANNELGROUPS,
								x: Position.PREVIOUS,
								y: Position.ADVANCE
							}
						]
					}
				]
			}
		};

		createViewFromTemplate(viewTemplate, projectFile, templateFile);

		const view = projectFile.getViewIdFromName(Object.keys(autoMetersTemplate)[0]);
		const controls = projectFile.getControlsByViewId(view!);
		expect(view).toBeTruthy();
		expect(controls?.length).toBeTruthy();
	});

	it('should correctly set the view height when child templates are present', () => {
		const viewTemplate: ViewTemplate = {
			'Auto Meters': {
				startX: 1,
				startY: 1,
				paddingX: 10,
				paddingY: 10,
				insideOut: false,
				templates: [
					{
						title: 'Meters Title',
						x: 1,
						y: Position.ADVANCE_NEXT
					},
					{
						title: 'Meters Group',
						x: Position.ADVANCE_NEXT,
						y: Position.PREVIOUS,
						assign: Assign.CHANNELGROUPS,
						templates: [
							{
								title: 'Meter',
								assign: Assign.CHANNELGROUPS,
								x: Position.PREVIOUS,
								y: Position.ADVANCE
							}
						]
					}
				]
			}
		};

		createViewFromTemplate(viewTemplate, projectFile, templateFile);

		const viewId = projectFile.getViewIdFromName(Object.keys(autoMetersTemplate)[0]);
		const view = projectFile.getAllRemoteViews()?.find((v) => v.ViewId === viewId);
		expect(view?.VRes).toBe(3259.0001);
	});

	// it('should create the main view 2', () => {
	// 	const viewTemplate: ViewTemplate = {
	// 		'Auto Main': {
	// 			startX: 1,
	// 			startY: 1,
	// 			paddingX: 10,
	// 			paddingY: 10,
	// 			insideOut: false,
	// 			templates: [
	// 				{
	// 					title: 'Main Title',
	// 					x: 1,
	// 					y: Position.ADVANCE_NEXT
	// 				},
	// 				{
	// 					title: 'Main Overview',
	// 					x: Position.PREVIOUS,
	// 					y: Position.ADVANCE_NEXT,
	// 					assign: Assign.MASTER
	// 				},
	// 				{
	// 					title: 'Main Fallback',
	// 					x: Position.ADVANCE_NEXT,
	// 					y: Position.PREVIOUS,
	// 					assign: Assign.FALLBACK
	// 				},
	// 				{
	// 					title: 'Main DS10',
	// 					x: Position.PREVIOUS_PLUS_PADDING,
	// 					y: Position.PREVIOUS,
	// 					assign: Assign.FALLBACK
	// 				},
	// 				{
	// 					title: 'Group',
	// 					x: Position.ADVANCE,
	// 					y: Position.PREVIOUS,
	// 					assign: Assign.CHANNELGROUPS,
	// 					templates: [
	// 						{
	// 							title: 'Meter',
	// 							assign: Assign.CHANNELGROUPS,
	// 							x: Position.PREVIOUS,
	// 							y: Position.ADVANCE
	// 						}
	// 					]
	// 				}
	// 			]
	// 		}
	// 	};

	// 	createViewFromTemplate(viewTemplate, projectFile, templateFile);

	// 	const view = projectFile.getViewIdFromName(Object.keys(autoMetersTemplate)[0]);
	// 	const controls = projectFile.getControlsByViewId(view!);
	// 	expect(view).toBeTruthy();
	// 	expect(controls?.length).toBe(10);
	// });

	it('should create the main view', () => {
		const config: PageConfig[] = [
			{
				// New view
				name: 'Auto Main',
				templates: [
					{
						name: AutoR1TemplateTitles.MAIN_TITLE,
						initialPosition: { x: 10, y: 10 }
					},
					{
						name: AutoR1TemplateTitles.MAIN_OVERVIEW,
						type: 'Master',
						initialPosition: { x: 10, y: 67 }
					},
					{
						name: AutoR1TemplateTitles.MAIN_FALLBACK,
						type: 'Fallback',
						initialPosition: { x: 10, y: 266 }
					},
					{
						name: AutoR1TemplateTitles.MAIN_DS10,
						type: 'DS',
						initialPosition: { x: 130, y: 266 }
					},
					{
						name: AutoR1TemplateTitles.THC,
						type: 'AP',
						initialPosition: { x: 238, y: 67 }
					},
					{
						name: AutoR1TemplateTitles.GROUP,
						type: 'SourceGroup',
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
						initialPosition: { x: 230, y: 20 }
					}
				]
			},
			{
				// All current views
				paddingY: 30,
				controls: [
					{
						Type: dbpr.ControlTypes.SWITCH,
						DisplayName: 'Auto Main',
						Width: 140,
						Height: 25,
						TargetType: dbpr.TargetTypes.VIEW,
						Target: 'Auto Main',
						Property: 'Page',
						initialPosition: { x: 230, y: 20 }
					},
					{
						Type: dbpr.ControlTypes.SWITCH,
						DisplayName: 'Auto Meters',
						Width: 140,
						Height: 25,
						TargetType: dbpr.TargetTypes.VIEW,
						Target: 'Auto Meters',
						Property: 'Page',
						initialPosition: { x: 410, y: 20 }
					}
				]
			}
		];

		config.forEach((view) => {
			handleViewConfig(view, projectFile, templateFile);
		});

		const views = projectFile.getAllRemoteViews();

		const mainView = views?.find((v) => v.Name === config[0].name);

		expect(mainView).toBeTruthy();
	});

	it('should create the meter view 2', () => {
		const config: PageConfig[] = [
			{
				// New view
				name: 'Auto Meters',
				templates: [
					{
						name: AutoR1TemplateTitles.METERS_TITLE,
						initialPosition: { x: 10, y: 10 }
					},
					{
						name: AutoR1TemplateTitles.METERS_GROUP,
						type: 'ChannelGroup',
						initialPosition: { x: 10, y: 67 },
						propagation: {
							direction: 'horizontal',
							spacing: 10
						},
						children: [
							{
								name: AutoR1TemplateTitles.METER,
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
			}
		];

		config.forEach((view) => {
			handleViewConfig(view, projectFile, templateFile);
		});

		const views = projectFile.getAllRemoteViews();

		const mainView = views?.find((v) => v.Name === config[0].name);

		expect(mainView).toBeTruthy();
	});

	it('should create all AutoR1 additions', () => {
		config.forEach((view) => handleViewConfig(view, projectFile, templateFile));

		const views = projectFile
			.getAllRemoteViews()
			?.filter((view) => config.find((cfg) => cfg.name === view.Name));
		expect(views?.length).toBeTruthy();

		const controls = projectFile.getAllControls();
		const mainButtons = controls?.filter(
			(control) => control.Type === dbpr.ControlTypes.SWITCH && control.DisplayName === 'Auto Main'
		);
		const meterButtons = controls?.filter(
			(control) =>
				control.Type === dbpr.ControlTypes.SWITCH && control.DisplayName === 'Auto Meters'
		);
		const eqButtons = controls?.filter(
			(control) => control.Type === dbpr.ControlTypes.SWITCH && control.DisplayName === 'Auto EQ'
		);

		expect(mainButtons?.length).toBe(27);
		expect(meterButtons?.length).toBe(27);
		expect(eqButtons?.length).toBe(27);

		controls?.forEach((control) => {
			// DS Data string
			if (control.TargetProperty === dbpr.TargetPropertyType.INPUT_DIGITAL_TX_STREAM) {
				expect(control.TargetChannel).toBeLessThanOrEqual(0);
			}

			// DS Data LED
			if (control.TargetProperty === dbpr.TargetPropertyType.INPUT_DIGITAL_DS_DATA_PRI) {
				expect(control.TargetChannel).toBeLessThanOrEqual(0);
			}
			if (control.TargetProperty === dbpr.TargetPropertyType.INPUT_DIGITAL_DS_DATA_SEC) {
				expect(control.TargetChannel).toBeLessThanOrEqual(0);
			}

			// Amp status
			if (control.TargetProperty === dbpr.TargetPropertyType.STATUS_STATUS_TEXT) {
				expect(control.TargetChannel).toBeLessThanOrEqual(0);
			}

			// Sync status
			if (control.TargetProperty === dbpr.TargetPropertyType.INPUT_DIGITAL_SYNC) {
				expect(control.TargetChannel).toBeLessThanOrEqual(0);
			}
		});

		const mainViewId = projectFile.getViewIdFromName('Auto Main');

		const mainViewRelativeDelayControls = projectFile
			.getControlsByViewId(mainViewId!)
			?.filter(
				(control) => control.TargetProperty === dbpr.TargetPropertyType.CHANNEL_STATUS_MS_DELAY
			)
			.filter((control) => control.Flags === dbpr.ControlFlags.RELATIVE);
		const mainViewAbsoluteDelayControls = projectFile
			.getControlsByViewId(mainViewId!)
			?.filter(
				(control) => control.TargetProperty === dbpr.TargetPropertyType.CHANNEL_STATUS_MS_DELAY
			)
			.filter((control) => control.Flags === dbpr.ControlFlags.ABSOLUTE);
		expect(mainViewRelativeDelayControls?.length).toBe(5);
		expect(mainViewAbsoluteDelayControls?.length).toBe(7);

		const eqViewId = projectFile.getViewIdFromName('Auto EQ');
		const eqControl = projectFile
			.getControlsByViewId(eqViewId!)
			?.filter((control) => control.Type === dbpr.ControlTypes.EQ)![0];

		const parentGroup = projectFile.getParentGroupFromGroupId(eqControl?.TargetId!);
		const masterGroupId = projectFile.getMasterGroupID();
		expect(parentGroup?.ParentId).toBe(masterGroupId);
	});

	it('should append templates to existing views', () => {
		const config: PageConfig[] = [
			{
				// All current views
				paddingY: 30,
				controls: [
					{
						Type: dbpr.ControlTypes.SWITCH,
						DisplayName: 'Auto Main',
						Width: 140,
						Height: 25,
						TargetType: dbpr.TargetTypes.VIEW,
						Target: 'Auto Main',
						Property: 'Page',
						initialPosition: { x: 230, y: 20 }
					},
					{
						Type: dbpr.ControlTypes.SWITCH,
						DisplayName: 'Auto Meters',
						Width: 140,
						Height: 25,
						TargetType: dbpr.TargetTypes.VIEW,
						Target: 'Auto Meters',
						Property: 'Page',
						initialPosition: { x: 410, y: 20 }
					}
				]
			}
		];

		config.forEach((view) => handleViewConfig(view, projectFile, templateFile));

		const controls = projectFile.getAllControls();
		const mainSwitches = controls?.filter(
			(control) =>
				control.DisplayName === config[0].controls![0].DisplayName &&
				control.Type === config[0].controls![0].Type
		);

		const meterSwitches = controls?.filter(
			(control) =>
				control.DisplayName === config[0].controls![1].DisplayName &&
				control.Type === config[0].controls![1].Type
		);

		expect(mainSwitches!.length + meterSwitches!.length).toBe(48);
	});

	describe('main view', () => {
		const config: PageConfig[] = [
			{
				// New view
				name: 'Auto Main',
				templates: [
					{
						name: AutoR1TemplateTitles.MAIN_TITLE,
						initialPosition: { x: 10, y: 10 }
					},
					{
						name: AutoR1TemplateTitles.MAIN_OVERVIEW,
						type: 'Master',
						initialPosition: { x: 10, y: 67 }
					},
					{
						name: AutoR1TemplateTitles.MAIN_FALLBACK,
						type: 'Fallback',
						initialPosition: { x: 10, y: 266 }
					},
					{
						name: AutoR1TemplateTitles.MAIN_DS10,
						type: 'DS',
						initialPosition: { x: 238, y: 266 }
					},
					{
						name: AutoR1TemplateTitles.THC,
						type: 'AP',
						initialPosition: { x: 238, y: 67 }
					},
					{
						name: AutoR1TemplateTitles.GROUP,
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
						initialPosition: { x: 230, y: 20 }
					}
				]
			},
			{
				// All current views
				paddingY: 30,
				controls: [
					{
						Type: dbpr.ControlTypes.SWITCH,
						DisplayName: 'Auto Main',
						Width: 140,
						Height: 25,
						TargetType: dbpr.TargetTypes.VIEW,
						Target: 'Auto Main',
						Property: 'Page',
						initialPosition: { x: 230, y: 20 }
					},
					{
						Type: dbpr.ControlTypes.SWITCH,
						DisplayName: 'Auto Meters',
						Width: 140,
						Height: 25,
						TargetType: dbpr.TargetTypes.VIEW,
						Target: 'Auto Meters',
						Property: 'Page',
						initialPosition: { x: 410, y: 20 }
					}
				]
			}
		];

		it('should correctly assign level control to group', () => {
			config.forEach((view) => {
				handleViewConfig(view, projectFile, templateFile);
			});

			const mainViewId = projectFile.getViewIdFromName(config[0].name!);
			const mainViewControls = projectFile
				.getAllControls()
				?.filter((control) => control.ViewId === mainViewId)!;

			const mainViewLevelControls = mainViewControls.filter(
				(control) =>
					control.Type === dbpr.ControlTypes.DIGITAL &&
					control.TargetProperty === dbpr.TargetPropertyType.CONFIG_POTI_LEVEL
			);

			const sourceGroupViewLevelSwitches = mainViewLevelControls.map((c) => {
				const joinedControls = projectFile.getControlsByJoinedId(c.JoinedId);
				const sourceGroupViewSwitch = joinedControls?.find(
					(c) => c.Type === dbpr.ControlTypes.SWITCH && c.TargetType === dbpr.TargetTypes.VIEW
				)!;

				const sourceGroupViewId = projectFile.getViewIdFromName(
					sourceGroupViewSwitch?.DisplayName!
				)!;

				const sourceGroupViewControls = projectFile.getControlsByViewId(sourceGroupViewId);

				const sourceGroupViewLevelControl = sourceGroupViewControls?.find(
					(c) =>
						c.Type === dbpr.ControlTypes.FADER &&
						c.TargetProperty === dbpr.TargetPropertyType.CONFIG_POTI_LEVEL
				)!;

				const found = mainViewLevelControls.find(
					(c) =>
						c.TargetChannel === sourceGroupViewLevelControl.TargetChannel &&
						c.TargetId === sourceGroupViewLevelControl.TargetId
				);

				expect(
					mainViewLevelControls.find(
						(c) =>
							c.TargetChannel === sourceGroupViewLevelControl.TargetChannel &&
							c.TargetId === sourceGroupViewLevelControl.TargetId
					)
				).toBeTruthy();

				return sourceGroupViewLevelControl;
			});
		});

		it('should correctly label filter 1 switch', () => {
			config.forEach((view) => {
				handleViewConfig(view, projectFile, templateFile);
			});

			const mainViewId = projectFile.getViewIdFromName(config[0].name!);
			const mainViewControls = projectFile
				.getAllControls()
				?.filter((control) => control.ViewId === mainViewId)!;

			const mainViewFilter1Controls = mainViewControls.filter(
				(control) =>
					control.Type === dbpr.ControlTypes.SWITCH &&
					control.TargetProperty === dbpr.TargetPropertyType.CONFIG_FILTER1
			);

			mainViewFilter1Controls.map((c) => {
				const joinedControls = projectFile.getControlsByJoinedId(c.JoinedId);
				const sourceGroupViewSwitch = joinedControls?.find(
					(c) => c.Type === dbpr.ControlTypes.SWITCH && c.TargetType === dbpr.TargetTypes.VIEW
				)!;

				const sourceGroupViewId = projectFile.getViewIdFromName(
					sourceGroupViewSwitch?.DisplayName!
				)!;

				const sourceGroupViewControls = projectFile.getControlsByViewId(sourceGroupViewId);

				const sourceGroupViewFilter1Control = sourceGroupViewControls?.find(
					(c) =>
						c.Type === dbpr.ControlTypes.SWITCH &&
						c.TargetProperty === dbpr.TargetPropertyType.CONFIG_FILTER1
				)!;

				const found = mainViewFilter1Controls.find(
					(c) =>
						c.TargetChannel === sourceGroupViewFilter1Control.TargetChannel &&
						c.TargetId === sourceGroupViewFilter1Control.TargetId
				);

				const matchedControl = mainViewFilter1Controls.find(
					(c) =>
						c.TargetChannel === sourceGroupViewFilter1Control.TargetChannel &&
						c.TargetId === sourceGroupViewFilter1Control.TargetId
				);

				expect(matchedControl).toBeTruthy();

				expect(matchedControl?.DisplayName).toEqual(sourceGroupViewFilter1Control.DisplayName);

				return sourceGroupViewFilter1Control;
			});
		});
	});
});
