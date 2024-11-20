import {
	AutoR1Control,
	AutoR1ProjectFile,
	AutoR1TemplateFile,
	AutoR1TemplateTitles,
	ChannelGroup,
	METER_SPACING_X,
	METER_SPACING_Y,
	METER_VIEW_STARTX,
	METER_VIEW_STARTY,
	SourceGroup,
	TemplateOptions
} from './autor1';
import { ActionTypes, Group, TargetChannels, TargetTypes } from './dbpr';
import { PageConfig, ViewTemplateManager } from './ViewTemplateManager';

export enum Position {
	PREVIOUS = 0,
	PREVIOUS_PLUS_PADDING = -2,
	ADVANCE_NEXT = -1,
	ADVANCE = -3
}

export enum Assign {
	SOURCEGROUPS = 'SOURCEGROUPS',
	CHANNELGROUPS = 'SOURCEGROUPSLR',
	CHANNELS = 'CHANNELS',
	MUTE = 'MUTE',
	FALLBACK = 'FALLBACK',
	DS = 'DS',
	MASTER = 'MASTER'
}

export interface Template {
	title: string;
	x: number;
	y: number;
	assign?: Assign;
	advanceX?: boolean;
	advanceY?: boolean;
	templates?: Template[];
}

export interface ViewTemplate {
	[key: string]: {
		startX: number;
		startY: number;
		paddingX: number;
		paddingY: number;
		insideOut?: boolean;
		templates: Template[];
	};
}

interface ViewTemplateOptions {
	DisplayName: string;
	TargetId: number;
	TargetChannel?: number;
	SourceGroupType?: number;
	SourceGroup?: SourceGroup;
	ChannelGroup?: ChannelGroup;
	Channel?: Group;
	children?: ViewTemplateOptions[];
}

export const autoMetersTemplate: ViewTemplate = {
	'Auto Meters': {
		paddingX: METER_SPACING_X,
		paddingY: METER_SPACING_Y,
		startX: METER_VIEW_STARTX,
		startY: METER_VIEW_STARTY,
		templates: [
			{
				title: AutoR1TemplateTitles.METERS_TITLE,
				x: 0,
				y: Position.ADVANCE_NEXT
			},
			{
				title: AutoR1TemplateTitles.METERS_GROUP,
				x: Position.ADVANCE_NEXT,
				y: Position.PREVIOUS,
				assign: Assign.CHANNELGROUPS,
				templates: [
					{
						title: AutoR1TemplateTitles.METER,
						assign: Assign.CHANNELGROUPS,
						x: Position.PREVIOUS,
						y: Position.ADVANCE
					}
				]
			}
		]
	}
};

export const getViewNames = (projectTemplate: ViewTemplate) => Object.keys(projectTemplate);

export const projectFileToTemplateObject = (
	projectFile: AutoR1ProjectFile
): ViewTemplateOptions[] => {
	const channelGroups = projectFile.sourceGroups
		.map((sourceGroup) =>
			sourceGroup.channelGroups
				.filter((channelGroup) =>
					channelGroup.hasLorR() ? (channelGroup.isLorR() ? true : false) : true
				)
				.map((channelGroup) => {
					return {
						DisplayName: channelGroup.name,
						TargetId: channelGroup.groupId,
						TargetChannel: TargetChannels.NONE,
						SourceGroup: sourceGroup,
						ChannelGroup: channelGroup,
						children: channelGroup.channels.map((channel) => {
							const DisplayName = `${channel.Name} - ${projectFile.getCanIdFromDeviceId(
								channel.TargetId
							)} - ${['', 'A', 'B', 'C', 'D'][channel.TargetChannel]}`;
							return {
								DisplayName,
								TargetId: channel.TargetId,
								TargetChannel: channel.TargetChannel,
								sourceGroupType: sourceGroup.Type,
								SourceGroup: sourceGroup,
								ChannelGroup: channelGroup,
								Channel: channel
							};
						})
					};
				})
		)
		.flat();

	return channelGroups;
};

export const parsePos = (pos: number, prev: number, padding: number, templateSize: number) => {
	let newPos = pos;
	let cb = (t = 0) => 0;
	if (pos === Position.PREVIOUS) {
		newPos = prev;
	} else if (pos === Position.PREVIOUS_PLUS_PADDING) {
		newPos = prev + padding;
	} else if (pos === Position.ADVANCE) {
		newPos = prev + padding + templateSize;
	} else if (pos === Position.ADVANCE_NEXT) {
		newPos = prev;
		cb = (t = 0) => padding + (t || templateSize);
	} else {
		newPos = pos;
	}

	return { newPos, cb };
};

// TODO: also disgusting
export const createViewFromTemplate = (
	viewTemplate: ViewTemplate,
	projectFile: AutoR1ProjectFile,
	templateFile: AutoR1TemplateFile
) => {
	const titles = getViewNames(viewTemplate);
	const formattedChannelGroups = projectFileToTemplateObject(projectFile);

	let curX = 0;
	let curY = 0;
	let viewWidth = 0;
	let viewHeight = 0;

	titles.forEach((title) => {
		const { startX, startY, paddingX, paddingY, templates } = viewTemplate[title];
		const viewId = projectFile.createView(title);

		curX = startX;
		curY = startY;

		templates.forEach((template) => {
			(template.templates ? formattedChannelGroups : [undefined]).forEach(
				(channelGroup: ViewTemplateOptions | undefined) => {
					const { x, y, maxX, maxY } = handleViewTemplate(
						channelGroup,
						projectFile,
						templateFile,
						viewId,
						template,
						curX,
						curY,
						paddingX,
						paddingY
					);
					curX = x;
					curY = y;
					viewWidth = Math.max(viewWidth, maxX);
					viewHeight = Math.max(viewHeight, maxY);
				}
			);
		});

		const values = {
			HRes: viewWidth,
			VRes: viewHeight
		};
		projectFile.updateView(viewId, values);
	});

	return { x: curX, y: curY, width: viewWidth, height: viewHeight };
};

export const handleViewConfig = (
	pageConfig: PageConfig,
	projectFile: AutoR1ProjectFile,
	templateFile: AutoR1TemplateFile
) => {
	const views = projectFile.getAllRemoteViews();
	let viewId: number;

	// If new view
	if (pageConfig.name) {
		const view = views?.find((view) => view.Name === pageConfig.name);
		viewId = view?.ViewId ?? projectFile.createView(pageConfig.name);
	} else {
		// If only controls
		views?.forEach((view) => {
			const { ViewId } = view;

			const increaseControlPosByAmount = (pos: 'X' | 'Y', padding: number, viewId: number) =>
				projectFile.db.prepare(
					`UPDATE Controls SET Pos${pos} = Pos${pos} + ${padding} WHERE ViewId = ${viewId}`
				);

			increaseControlPosByAmount('X', pageConfig.paddingX ?? 0, ViewId).run();
			increaseControlPosByAmount('Y', pageConfig.paddingY ?? 0, ViewId).run();
		});
	}

	const layoutManager = new ViewTemplateManager(pageConfig, projectFile, templateFile);
	const renderedTemplates = layoutManager.generateLayout();
	const renderedControls = layoutManager.renderedControls;

	renderedTemplates.forEach((template) => {
		const { name, position } = template;
		const array = [name];
		if (template.additions?.isLR) array.push('LR');
		if (template.additions?.isAP) array.push('AP');
		if (template.additions?.hasCPLv2) array.push('CPL2');

		const loadedTemplate = templateFile.getTemplateWithStrings(array);

		if (pageConfig.name) {
			projectFile.insertTemplate(loadedTemplate, viewId, position.x, position.y, template.options);

			const { maxX, maxY } = projectFile.getFurthestPointsFromView(viewId);

			projectFile.updateView(viewId, { HRes: maxX + 100, VRes: maxY + 100 });
		} else {
			views?.forEach((view) => {
				const { ViewId } = view;

				projectFile.insertTemplate(
					loadedTemplate,
					ViewId,
					position.x,
					position.y,
					template.options
				);
			});
		}
	});

	renderedControls.forEach((control) => {
		const { TargetType, Target } = control;
		if (TargetType === TargetTypes.VIEW) {
			const view = projectFile.getAllRemoteViews()?.find((view) => view.Name === Target);
			control.TargetId = view?.ViewId;
			control.Flags = 262;
			control.ActionType = ActionTypes.NAVIGATION;
			control.MainColor = 7;
			control.SubColor = 7;
			control.TargetProperty = '' as never;
		} else if (control.type) {
			switch (control.Target) {
				case 'Mute':
					control.TargetId === projectFile.getMuteGroupID();
					break;
				case 'AP':
					control.TargetId === projectFile.getAPGroup()?.GroupId;
					break;
				case 'Fallback':
					control.TargetId === projectFile.getFallbackGroupID();
					break;
				case 'Master':
					control.TargetId === projectFile.getMasterGroupID();
					break;
			}
		}
		const ar1Control = new AutoR1Control(control);

		if (pageConfig.name) {
			const view = projectFile.getAllRemoteViews()?.find((view) => view.Name === pageConfig.name);
			if (view) {
				ar1Control.ViewId = view?.ViewId;
				projectFile.insertControl(ar1Control);
			}
		} else {
			views?.forEach((view) => {
				const { ViewId } = view;
				ar1Control.ViewId = ViewId;
				projectFile.insertControl(ar1Control);
			});
		}
	});
};

// TODO: this is pretty disgusting
export const handleViewTemplate = (
	obj: ViewTemplateOptions | undefined,
	projectFile: AutoR1ProjectFile,
	templateFile: AutoR1TemplateFile,
	viewId: number,
	template: Template,
	x: number,
	y: number,
	paddingX: number,
	paddingY: number,
	prevTemplate?: { width: number; height: number }
) => {
	const { title, x: templateX, y: templateY, templates, assign } = template;

	const loadedTemplate = templateFile.getTemplateByName(title);
	const { width, height } = loadedTemplate;

	let { newPos: newPosX, cb: cbX } = parsePos(
		templateX,
		x,
		paddingX,
		prevTemplate ? prevTemplate.width : width
	);
	let { newPos: newPosY, cb: cbY } = parsePos(
		templateY,
		y,
		paddingY,
		prevTemplate ? prevTemplate.height : height
	);

	const options: TemplateOptions | undefined = obj
		? {
				DisplayName: obj.DisplayName,
				TargetId: obj.TargetId,
				TargetChannel: obj.TargetChannel,
				sourceGroupType: obj.SourceGroupType,
				sourceGroup: obj.SourceGroup,
				channelGroup: obj.ChannelGroup,
				channel: obj.Channel
			}
		: undefined;
	projectFile.insertTemplate(loadedTemplate, viewId, newPosX, newPosY, options);

	let maxX = newPosX + (prevTemplate?.width || width);
	let maxY = newPosY + (prevTemplate?.height || height);

	templates?.forEach((template) => {
		let childX = newPosX;
		let childY = newPosY;

		let childPrevWidth = width;
		let childPrevHeight = height;
		(obj?.children || [obj]).forEach((obj) => {
			const {
				x,
				y,
				maxX: childMaxX,
				maxY: childMaxY,
				width: childWidth,
				height: childHeight
			} = handleViewTemplate(
				obj,
				projectFile,
				templateFile,
				viewId,
				template,
				childX,
				childY,
				paddingX,
				paddingY,
				{ width: childPrevWidth, height: childPrevHeight }
			);
			childX = x;
			childY = y;
			maxX = Math.max(childMaxX, maxX);
			maxY = Math.max(childMaxY, maxY);
			childPrevWidth = childWidth;
			childPrevHeight = childHeight;
		});
	});

	return {
		x: Math.max(newPosX + cbX(), cbX(maxX)),
		y: newPosY + cbY(),
		maxX,
		maxY,
		width,
		height
	};
};
