import { AutoR1ProjectFile, AutoR1Template, AutoR1TemplateFile, SourceGroup } from '../../autor1';
import { SourceGroupTypes, TargetChannels } from '../../dbpr';
import {
	Assign,
	createViewFromTemplate,
	getViewNames,
	ViewTemplate,
	parsePos,
	Position
} from '../../viewTemplates';
import SQLjs from 'sql.js';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

vi.mock('sql.js');

const get = vi.fn();
const getAsObject = vi.fn();
const bind = vi.fn();
const step = vi.fn();
const run = vi.fn();
const free = vi.fn();
let prepare: Mock;
let Database: Mock;

const viewTemplate: ViewTemplate = {
	'Auto Meters': {
		startX: 0,
		startY: 0,
		paddingX: 10,
		paddingY: 10,
		templates: [
			{
				title: 'METERS_TITLE',
				x: 10,
				y: 10
			},
			{
				// Creates a METERS_GROUP template for every sourceGroupsLR from left to right
				title: 'METERS_GROUP',
				x: Position.ADVANCE_NEXT,
				y: Position.PREVIOUS_PLUS_PADDING,
				templates: [{ title: 'METER', x: Position.PREVIOUS, y: Position.ADVANCE_NEXT }]
			},
			{
				// Creates a NAV_BUTTONS template for every sourceGroupsLR from left to right
				title: 'NAV_BUTTONS',
				x: Position.PREVIOUS,
				y: Position.PREVIOUS,
				advanceX: false,
				advanceY: false
			}
		]
	}
};

beforeEach(() => {
	vi.resetAllMocks();

	prepare = vi.fn(() => ({ get, getAsObject, bind, step, free, run }));
	Database = vi.fn(() => ({ prepare }));
	(SQLjs as unknown as Mock).mockReturnValue({
		Database
	});
});

describe('getViewName', () => {
	it('gets the view names', () => {
		const viewNames = getViewNames(viewTemplate);

		expect(viewNames).toHaveLength(1);
		expect(viewNames).toStrictEqual(['Auto Meters']);
	});
});

describe('parsePos', () => {
	it('Position.PREVIOUS returns previous position', () => {
		const startPosition = 10;
		const requestedPosition = Position.PREVIOUS;
		const padding = 20;
		const templateSize = 30;

		const { newPos } = parsePos(requestedPosition, startPosition, padding, templateSize);

		expect(newPos).toBe(startPosition);
	});

	it('Position.PREVIOUS_PLUS_PADDING returns previous plus padding', () => {
		const startPosition = 10;
		const requestedPosition = Position.PREVIOUS_PLUS_PADDING;
		const padding = 20;
		const templateSize = 30;

		const { newPos } = parsePos(requestedPosition, startPosition, padding, templateSize);

		expect(newPos).toBe(startPosition + padding);
	});
	it('Position.ADVANCE_NEXT returns previous position and call back adds templateSize and padding', () => {
		const startPosition = 10;
		const requestedPosition = Position.ADVANCE_NEXT;
		const padding = 20;
		const templateSize = 30;

		const { newPos, cb } = parsePos(requestedPosition, startPosition, padding, templateSize);

		expect(newPos).toBe(startPosition);
		expect(newPos + cb()).toBe(startPosition + padding + templateSize);
	});
});

describe('myfunc', () => {
	it('Creates Auto Meters View correctly where child template is wider than parent (METER wider than METERS_GROUP)', async () => {
		getAsObject.mockReturnValueOnce({ GroupId: 1 });
		const projectFile = await AutoR1ProjectFile.build(true as any);
		get.mockReturnValueOnce({ GroupId: 1 });
		const templateFile = await AutoR1TemplateFile.build(true as any);
		const templates: AutoR1Template[] = [
			{ name: 'METERS_TITLE', width: 10, height: 10 },
			{ name: 'METERS_GROUP', width: 100, height: 100 },
			{ name: 'METER', width: 1000, height: 1000 }
		] as any;
		templateFile.templates = templates;
		projectFile.sourceGroups = [
			{
				Name: 'sg1',
				Type: SourceGroupTypes.ARRAY,
				SourceGroupId: 1,
				channelGroups: [
					{
						name: 'cg1',
						groupId: 10,
						hasLorR: () => false,
						channels: [
							{
								Name: 'c1',
								TargetId: 1000,
								TargetChannel: TargetChannels.CHANNEL_A
							},
							{
								Name: 'c2',
								TargetId: 1000,
								TargetChannel: TargetChannels.CHANNEL_A
							},
							{
								Name: 'c3',
								TargetId: 1000,
								TargetChannel: TargetChannels.CHANNEL_A
							},
							{
								Name: 'c4',
								TargetId: 1000,
								TargetChannel: TargetChannels.CHANNEL_A
							}
						]
					},
					{
						name: 'cg2',
						groupId: 10,
						hasLorR: () => false,
						channels: [
							{
								Name: 'c5',
								TargetId: 1000,
								TargetChannel: TargetChannels.CHANNEL_A
							},
							{
								Name: 'c6',
								TargetId: 1000,
								TargetChannel: TargetChannels.CHANNEL_A
							},
							{
								Name: 'c7',
								TargetId: 1000,
								TargetChannel: TargetChannels.CHANNEL_A
							},
							{
								Name: 'c8',
								TargetId: 1000,
								TargetChannel: TargetChannels.CHANNEL_A
							}
						]
					}
				]
			},
			{
				Name: 'sg2',
				Type: SourceGroupTypes.ARRAY,
				SourceGroupId: 1,
				channelGroups: [
					{
						name: 'cg3',
						groupId: 10,
						hasLorR: () => false,
						channels: [
							{
								Name: 'c9',
								TargetId: 1000,
								TargetChannel: TargetChannels.CHANNEL_A
							},
							{
								Name: 'c10',
								TargetId: 1000,
								TargetChannel: TargetChannels.CHANNEL_A
							},
							{
								Name: 'c11',
								TargetId: 1000,
								TargetChannel: TargetChannels.CHANNEL_A
							},
							{
								Name: 'c12',
								TargetId: 1000,
								TargetChannel: TargetChannels.CHANNEL_A
							}
						]
					},
					{
						name: 'cg4',
						groupId: 10,
						hasLorR: () => false,
						channels: [
							{
								Name: 'c13',
								TargetId: 1000,
								TargetChannel: TargetChannels.CHANNEL_A
							},
							{
								Name: 'c14',
								TargetId: 1000,
								TargetChannel: TargetChannels.CHANNEL_A
							},
							{
								Name: 'c15',
								TargetId: 1000,
								TargetChannel: TargetChannels.CHANNEL_A
							},
							{
								Name: 'c16',
								TargetId: 1000,
								TargetChannel: TargetChannels.CHANNEL_A
							}
						]
					}
				]
			}
		] as SourceGroup[];
		const viewTemplate: ViewTemplate = {
			'Auto Meters': {
				startX: 1,
				startY: 1,
				paddingX: 10,
				paddingY: 10,
				insideOut: false,
				templates: [
					{
						title: 'METERS_TITLE',
						x: 1,
						y: Position.ADVANCE_NEXT
					},
					{
						title: 'METERS_GROUP',
						x: Position.ADVANCE_NEXT,
						y: Position.PREVIOUS,
						assign: Assign.CHANNELGROUPS,
						templates: [
							{
								title: 'METER',
								assign: Assign.CHANNELGROUPS,
								x: Position.PREVIOUS,
								y: Position.ADVANCE
							}
						]
					}
				]
			}
		};

		projectFile.insertTemplate = vi.fn();

		getAsObject.mockReturnValue({ 'max(ViewId)': 1024 });

		const { x, y, width, height } = createViewFromTemplate(viewTemplate, projectFile, templateFile);

		// Assert
		expect(width).toBe(
			viewTemplate['Auto Meters'].startX +
				templates[2].width * 4 +
				viewTemplate['Auto Meters'].paddingX * 3
		);
		expect(height).toBe(
			viewTemplate['Auto Meters'].startY +
				templates[0].height +
				templates[1].height +
				templates[2].height * 4 +
				viewTemplate['Auto Meters'].paddingY * 5
		);
	});

	it('Creates Auto Meters View correctly where child template is NOT wider than parent (METER NOT wider than METERS_GROUP)', async () => {
		getAsObject.mockReturnValueOnce({ GroupId: 1 });
		const projectFile = await AutoR1ProjectFile.build(true as any);
		get.mockReturnValueOnce({ GroupId: 1 });
		const templateFile = await AutoR1TemplateFile.build(true as any);
		const templates: AutoR1Template[] = [
			{ name: 'METERS_TITLE', width: 10, height: 10 },
			{ name: 'METERS_GROUP', width: 1000, height: 100 },
			{ name: 'METER', width: 100, height: 1000 }
		] as any;
		templateFile.templates = templates;
		projectFile.sourceGroups = [
			{
				name: 'sg1',
				SourceGroupId: 1,
				channelGroups: [
					{
						name: 'cg1',
						groupId: 10,
						hasLorR: () => false,
						channels: [
							{
								Name: 'c1',
								TargetId: 1000
							},
							{
								Name: 'c2',
								TargetId: 1000
							},
							{
								Name: 'c3',
								TargetId: 1000
							},
							{
								Name: 'c4',
								TargetId: 1000
							}
						]
					},
					{
						name: 'cg2',
						groupId: 10,
						hasLorR: () => false,
						channels: [
							{
								Name: 'c5',
								TargetId: 1000
							},
							{
								Name: 'c6',
								TargetId: 1000
							},
							{
								Name: 'c7',
								TargetId: 1000
							},
							{
								Name: 'c8',
								TargetId: 1000
							}
						]
					}
				]
			},
			{
				name: 'sg2',
				SourceGroupId: 1,
				channelGroups: [
					{
						name: 'cg3',
						groupId: 10,
						hasLorR: () => false,
						channels: [
							{
								Name: 'c9',
								TargetId: 1000
							},
							{
								Name: 'c10',
								TargetId: 1000
							},
							{
								Name: 'c11',
								TargetId: 1000
							},
							{
								Name: 'c12',
								TargetId: 1000
							}
						]
					},
					{
						name: 'cg4',
						groupId: 10,
						hasLorR: () => false,
						channels: [
							{
								Name: 'c13',
								TargetId: 1000
							},
							{
								Name: 'c14',
								TargetId: 1000
							},
							{
								Name: 'c15',
								TargetId: 1000
							},
							{
								Name: 'c16',
								TargetId: 1000
							}
						]
					}
				]
			}
		] as any;
		const viewTemplate: ViewTemplate = {
			'Auto Meters': {
				startX: 1,
				startY: 1,
				paddingX: 10,
				paddingY: 10,
				insideOut: false,
				templates: [
					{
						title: 'METERS_TITLE',
						x: 1,
						y: Position.ADVANCE_NEXT
					},
					{
						title: 'METERS_GROUP',
						x: Position.ADVANCE_NEXT,
						y: Position.PREVIOUS,
						assign: Assign.CHANNELGROUPS,
						templates: [
							{
								title: 'METER',
								assign: Assign.CHANNELGROUPS,
								x: Position.PREVIOUS,
								y: Position.ADVANCE
							}
						]
					}
				]
			}
		};

		projectFile.insertTemplate = vi.fn();

		getAsObject.mockReturnValue({ 'max(ViewId)': 1024 });

		const { x, y, width, height } = createViewFromTemplate(viewTemplate, projectFile, templateFile);

		// Assert
		expect(width).toBe(
			viewTemplate['Auto Meters'].startX +
				templates[1].width * 4 +
				viewTemplate['Auto Meters'].paddingX * 3
		);
		expect(height).toBe(
			viewTemplate['Auto Meters'].startY +
				templates[0].height +
				templates[1].height +
				templates[2].height * 4 +
				viewTemplate['Auto Meters'].paddingY * 5
		);
	});
});
