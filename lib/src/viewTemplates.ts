import {
	AutoR1ProjectFile,
	AutoR1TemplateFile,
	AutoR1TemplateTitles,
	METER_SPACING_X,
	METER_SPACING_Y,
	METER_VIEW_STARTX,
	METER_VIEW_STARTY,
	TemplateOptions
} from './autor1';

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
	DS = 'DS'
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
						children: channelGroup.channels.map((channel) => {
							const DisplayName = `${channel.Name} - ${projectFile.getCanIdFromDeviceId(
								channel.TargetId
							)} - ${['', 'A', 'B', 'C', 'D'][channel.TargetChannel]}`;
							return {
								DisplayName,
								TargetId: channel.TargetId,
								TargetChannel: channel.TargetChannel,
								sourceGroupType: sourceGroup.Type
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
	let cb = () => 0;
	if (pos === Position.PREVIOUS) {
		newPos = prev;
	} else if (pos === Position.PREVIOUS_PLUS_PADDING) {
		newPos = prev + padding;
	} else if (pos === Position.ADVANCE) {
		newPos = prev + padding + templateSize;
	} else if (pos === Position.ADVANCE_NEXT) {
		newPos = prev;
		cb = () => padding + templateSize;
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
			if (template.templates) {
				formattedChannelGroups.forEach((channelGroup) => {
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
					viewWidth = maxX;
					viewHeight = maxY;
				});
			} else {
				const { x, y, maxX, maxY } = handleViewTemplate(
					undefined,
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
				viewWidth = maxX;
				viewHeight = maxY;
			}
		});
	});

	return { x: curX, y: curY, width: viewWidth, height: viewHeight };
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

	if (obj) {
		const options: TemplateOptions = {
			DisplayName: obj.DisplayName,
			TargetId: obj.TargetId,
			TargetChannel: obj.TargetChannel,
			sourceGroupType: obj.SourceGroupType
		};
		projectFile.insertTemplate(loadedTemplate, viewId, newPosX, newPosY, options);
	} else {
		projectFile.insertTemplate(loadedTemplate, viewId, newPosX, newPosY);
	}

	let maxX = newPosX + (prevTemplate?.width || width);
	let maxY = newPosY + (prevTemplate?.height || height);

	newPosX = newPosX;
	newPosY = newPosY;

	templates?.forEach((template) => {
		let childX = newPosX;
		let childY = newPosY;

		if (obj && obj.children) {
			let childPrevWidth = width;
			let childPrevHeight = height;
			obj?.children?.forEach((child) => {
				const {
					x,
					y,
					maxX: childMaxX,
					maxY: childMaxY,
					width: childWidth,
					height: childHeight
				} = handleViewTemplate(
					child,
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
				maxX = childMaxX > maxX ? childMaxX : maxX;
				maxY = childMaxY > maxY ? childMaxY : maxY;
				childPrevWidth = childWidth;
				childPrevHeight = childHeight;
			});
		} else {
			const {
				x,
				y,
				maxX: childMaxX,
				maxY: childMaxY
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
				{ width, height }
			);
			childX = x;
			childY = y;
			maxX = childMaxX > maxX ? childMaxX : maxX;
			maxY = childMaxY > maxY ? childMaxY : maxY;
		}
	});

	return { x: newPosX + cbX(), y: newPosY + cbY(), maxX, maxY, width, height };
};
