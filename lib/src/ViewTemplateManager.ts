import {
	AutoR1Control,
	AutoR1ProjectFile,
	AutoR1TemplateFile,
	ChannelGroup,
	SourceGroup,
	TemplateOptions
} from './autor1';
import {
	Control,
	Group,
	MountingFlag,
	Section,
	SourceGroupTypes,
	TargetChannels,
	TargetTypes
} from './dbpr';

export enum TemplateTargetTypes {
	SourceGroup = 'SourceGroup',
	BandPassGroup = 'BandPassGroup',
	ChannelGroup = 'ChannelGroup',
	ChannelGroupFlown = 'ChannelGroupFlown',
	ChannelGroupGround = 'ChannelGroupGround',
	Channel = 'Channel',
	Mute = 'Mute',
	Fallback = 'Fallback',
	DS = 'DS',
	Master = 'Master',
	AP = 'AP',
	Group = 'Group',
	Device = 'Device',
	View = 'View',
	Snapshot = 'Snapshot'
}

export enum Relative {
	None = 0,
	X = 1,
	Y = 2,
	XY = 3
}

export enum Direction {
	Horizontal = 'horizontal',
	Vertical = 'vertical'
}

interface TemplateTarget {
	type: TemplateTargetTypes;
	name?: string;
	start?: number;
	end?: number;
}
interface Position {
	x: number;
	y: number;
	relative?: Relative;
}

interface Propagation {
	direction: Direction;
	itemLimit?: number;
	spacing: number;
	inverted?: boolean;
}

interface TemplateBase {
	target?: TemplateTarget;
	propagation?: Propagation;
	position?: Position;
	DisplayName?: string;
}

interface AutoR1TemplateControl extends TemplateBase {
	controls: Partial<Control>[];
	children?: AutoR1TemplateControl[];
}

interface AutoR1Template extends TemplateBase {
	name: string;
	children?: AutoR1Template[];
}

export interface PageConfig {
	name?: string;
	paddingX?: number;
	paddingY?: number;
	templates?: (AutoR1Template | AutoR1TemplateControl)[];
	initialPosition?: Position;
}

interface RenderedTemplate {
	name: string;
	type?: string;
	position: Position;
	options?: TemplateOptions;
	additions?: { isLR: boolean; isAP: boolean; hasCPLv2: boolean };
}

interface ViewTemplateOptions {
	DisplayName?: string;
	TargetId?: number;
	TargetChannel?: TargetChannels;
	TargetType?: TargetTypes;
	sourceGroup?: SourceGroup;
	channelGroup?: ChannelGroup;
	channel?: Group;
	sourceGroupType?: any;
	children?: ViewTemplateOptions[];
	index?: number;
}

export class ViewTemplateManager {
	private config: PageConfig;
	public renderedTemplates: RenderedTemplate[] = [];
	private projectFile: AutoR1ProjectFile;
	private templateFile: AutoR1TemplateFile;

	constructor(
		config: PageConfig,
		projectFile: AutoR1ProjectFile,
		templateFile: AutoR1TemplateFile
	) {
		this.config = config;
		this.projectFile = projectFile;
		this.templateFile = templateFile;
	}

	public generateLayout() {
		let lastPosition = { x: 0, y: 0 };
		this.config.templates?.forEach((template) => {
			const options = template.target ? this.configureTemplateTargets(template) : [{}];
			lastPosition = this.processTemplate(template, lastPosition, options);
		});
	}

	private createTemplateFromControlArray(controls: Partial<Control>[]) {
		const Id = this.templateFile.getNextId();
		const section: Section = {
			Description: '',
			JoinedId: this.templateFile.getNextJoinedId(),
			Id: Id,
			Name: Id.toString(),
			ParentId: 1
		};

		const autoR1Controls = controls.map((control) => new AutoR1Control(control));

		let width = 0;
		let height = 0;
		for (const row of autoR1Controls) {
			const PosX = row.PosX;
			const PosY = row.PosY;
			const Width = row.Width;
			const Height = row.Height;
			if (PosX + Width > width) {
				width = PosX + Width;
			}
			if (PosY + Height > height) {
				height = PosY + Height;
			}
		}

		this.templateFile.loadTemplate(section, autoR1Controls, width, height);

		return Id.toString();
	}

	private processTemplate(
		initialTemplate: AutoR1Template | AutoR1TemplateControl,
		initialPosition = { x: 0, y: 0 },
		options: ViewTemplateOptions[] = [{}]
	) {
		let template = initialTemplate;
		const isTemplate = (object: Control | TemplateBase) => 'name' in object;

		// Bunch o controls, create a cheeky virtual template
		if (!isTemplate(template)) {
			const name = this.createTemplateFromControlArray(template.controls!);
			template = { ...template, name } as AutoR1Template;
		}

		const relativePosition = {
			x:
				template.position?.relative === Relative.X || template.position?.relative === Relative.XY
					? initialPosition.x
					: 0,
			y:
				template.position?.relative === Relative.Y || template.position?.relative === Relative.XY
					? initialPosition.y
					: 0
		};

		const dimensions = this.templateFile.getTemplateWidthHeight(template.name);
		const { position } = template;

		const basePosition = {
			x: relativePosition.x + (position?.x || 0),
			y: relativePosition.y + (position?.y || 0)
		};

		let lastPosition = basePosition;

		let insertedCount = 0;
		(template.propagation?.inverted ? options.reverse() : options).forEach((option) => {
			const position = this.calculatePosition(
				template,
				basePosition,
				lastPosition,
				dimensions,
				insertedCount
			);
			lastPosition = position;

			const isLR = !!option.sourceGroup?.channelGroups.find((cg) => cg.isLeft() || cg.isRight());
			const hasCPLv2 = !!option.sourceGroup?.hasCPLv2();
			const isAP = !!option.sourceGroup?.ArrayProcessingEnable;

			this.renderedTemplates.push({
				name: template.name,
				type: template.target?.type,
				position: position,
				options: option,
				additions: { isLR, hasCPLv2, isAP }
			});

			template.children?.forEach((childTemplate) => {
				const childBasePosition = {
					x: lastPosition.x + (childTemplate.position?.x || 0),
					y: lastPosition.y + (childTemplate.position?.y || 0)
				};
				this.processTemplate(childTemplate, childBasePosition, option.children);
			});

			insertedCount = insertedCount + 1;
		});

		const finalPosition = {
			x: lastPosition.x + dimensions.width,
			y: lastPosition.y + dimensions.height
		};
		return finalPosition;
	}

	private calculatePosition(
		template: TemplateBase,
		basePosition: Position,
		lastPosition = { x: 0, y: 0 },
		dimensions = { width: 0, height: 0 },
		insertedCount = 0
	): Position {
		if (!template.propagation) {
			return basePosition;
		}

		const { width, height } = dimensions;
		const spacing = insertedCount
			? { x: template.propagation.spacing + width, y: template.propagation.spacing + height }
			: { x: 0, y: 0 };

		let newX =
			template.propagation.direction === 'horizontal' ? lastPosition.x + spacing.x : basePosition.x;
		let newY =
			template.propagation.direction === Direction.Vertical
				? lastPosition.y + spacing.y
				: basePosition.y;

		if (insertedCount && template.propagation.itemLimit) {
			if (template.propagation.direction === 'horizontal') {
				if (insertedCount % template.propagation.itemLimit === 0) {
					newX = basePosition.x;
				}
				newY =
					newY +
					(dimensions.height + template.propagation.spacing) *
						Math.floor(insertedCount / template.propagation.itemLimit);
			}

			if (template.propagation.direction === Direction.Vertical) {
				if (insertedCount % template.propagation.itemLimit === 0) {
					newY = basePosition.y;
				}
				newX =
					newX +
					(dimensions.width + template.propagation.spacing) *
						Math.floor(insertedCount / template.propagation.itemLimit);
			}
		}

		return {
			x: newX,
			y: newY
		};
	}

	private configureTemplateTargets(
		template: AutoR1Template | AutoR1TemplateControl,
		parent?: SourceGroup | ChannelGroup
	): ViewTemplateOptions[] {
		const handleChannel = (
			channel: Group,
			index: number,
			channelGroup: ChannelGroup,
			sourceGroup?: SourceGroup
		): ViewTemplateOptions => {
			const DisplayName = `${channel.Name} - ${this.projectFile.getCanIdFromDeviceId(
				channel.TargetId
			)} - ${['', 'A', 'B', 'C', 'D'][channel.TargetChannel]}`;
			return {
				DisplayName,
				TargetId: channel.TargetId,
				TargetChannel: channel.TargetChannel,
				TargetType: TargetTypes.CHANNEL,
				index,
				sourceGroup,
				channelGroup,
				channel,
				sourceGroupType: channelGroup.type
			};
		};

		const handleChannelGroup = (
			channelGroup: ChannelGroup,
			sourceGroup: SourceGroup,
			index: number
		): ViewTemplateOptions => {
			const children = channelGroup.channels.map((channel, index) =>
				handleChannel(channel, index, channelGroup, sourceGroup)
			);

			return {
				DisplayName: channelGroup.name,
				TargetId: channelGroup.groupId,
				TargetType: TargetTypes.GROUP,
				index,
				sourceGroup,
				channelGroup,
				children
			};
		};

		const { type, name, start: circuitStart, end: circuitsEnd } = template.target!;

		switch (type) {
			case TemplateTargetTypes.SourceGroup:
				const sourceGroups = name
					? this.projectFile.sourceGroups.filter((sg) => sg.Name === name)
					: this.projectFile.sourceGroups;

				return sourceGroups
					.map((sourceGroup, index) => {
						return {
							DisplayName: sourceGroup.Name,
							TargetId: sourceGroup.masterGroupId,
							TargetChannel: TargetChannels.NONE,
							TargetType: TargetTypes.GROUP,
							sourceGroup,
							index,
							children: sourceGroup.channelGroups
								.filter((channelGroup) =>
									channelGroup.hasLorR() ? (channelGroup.isLorR() ? true : false) : true
								)
								.map((channelGroup, index) => handleChannelGroup(channelGroup, sourceGroup, index))
								.flat()
						};
					})
					.slice(circuitStart, circuitsEnd);
			case TemplateTargetTypes.BandPassGroup:
				const sourceGroupsBPG = name
					? this.projectFile.sourceGroups.filter((sg) => sg.Name === name)
					: this.projectFile.sourceGroups;

				const bandPassGroups = sourceGroupsBPG
					.map((sourceGroup) => {
						// Master group for sub array and non-mixed point sources
						const shouldAssignMaster =
							sourceGroup.Type === SourceGroupTypes.SUBARRAY ||
							(sourceGroup.Type === SourceGroupTypes.POINT_SOURCE &&
								sourceGroup.hasSUBs() &&
								!sourceGroup.hasTOPs()) ||
							(sourceGroup.Type === SourceGroupTypes.POINT_SOURCE &&
								sourceGroup.hasTOPs() &&
								!sourceGroup.hasSUBs()) ||
							sourceGroup.Type === SourceGroupTypes.ADDITIONAL_AMPLIFIER;

						if (shouldAssignMaster) {
							const group = this.projectFile
								.getAllGroups()
								?.find((group) => group.GroupId === sourceGroup.masterGroupId)!;

							return [
								{
									TargetChannel: TargetChannels.NONE,
									TargetType: TargetTypes.GROUP,
									group,
									sourceGroup,
									channelGroup: sourceGroup.channelGroups.length
										? sourceGroup.channelGroups[0]
										: undefined
								}
							];
						} else {
							return sourceGroup.childGroupIds.map((childGroupId, index) => {
								const group = this.projectFile
									.getAllGroups()
									?.find((group) => group.GroupId === childGroupId)!;

								const channelGroup = sourceGroup.childGroups.find(
									(g) => g.groupId === childGroupId
								);

								return {
									TargetChannel: TargetChannels.NONE,
									TargetType: TargetTypes.GROUP,
									index,
									group,
									sourceGroup,
									channelGroup
								};
							});
						}
					})
					.flat()
					.slice(circuitStart, circuitsEnd);

				return bandPassGroups.map((channelGroup, index) => {
					return {
						DisplayName: channelGroup.group.Name,
						TargetId: channelGroup.group.GroupId,
						TargetChannel: TargetChannels.NONE,
						TargetType: TargetTypes.GROUP,
						index,
						sourceGroup: channelGroup.sourceGroup,
						channelGroup: channelGroup.channelGroup
					};
				});
			case TemplateTargetTypes.ChannelGroup:
				if ((parent as SourceGroup)?.SourceGroupId) {
					const sourceGroup = parent as SourceGroup;
					return sourceGroup.channelGroups
						.filter((channelGroup) =>
							channelGroup.hasLorR() ? (channelGroup.isLorR() ? true : false) : true
						)
						.map((channelGroup, index) => handleChannelGroup(channelGroup, sourceGroup, index))
						.flat()
						.slice(circuitStart, circuitsEnd);
				} else {
					const channelGroups = this.projectFile.sourceGroups
						.map((sourceGroup) =>
							sourceGroup.channelGroups
								.filter((channelGroup) =>
									channelGroup.hasLorR() ? (channelGroup.isLorR() ? true : false) : true
								)
								.map((channelGroup, index) => {
									const children = channelGroup.channels.map((channel, index) =>
										handleChannel(channel, index, channelGroup, sourceGroup)
									);

									return {
										DisplayName: channelGroup.name,
										TargetId: channelGroup.groupId,
										TargetChannel: TargetChannels.NONE,
										TargetType: TargetTypes.GROUP,
										index,
										sourceGroup,
										channelGroup,
										children
									};
								})
						)
						.flat()
						.slice(circuitStart, circuitsEnd);

					if (name) {
						return channelGroups.filter((cg) => cg.channelGroup.name === name);
					}

					return channelGroups;
				}
			case TemplateTargetTypes.ChannelGroupFlown:
				if (parent && 'Mounting' in parent && parent.Mounting === MountingFlag.FLOWN) {
					const sourceGroup = parent as SourceGroup;
					return sourceGroup.channelGroups
						.filter((channelGroup) => (channelGroup.hasLorR() ? channelGroup.isLorR() : true))
						.map((channelGroup, index) => handleChannelGroup(channelGroup, sourceGroup, index))
						.flat()
						.slice(circuitStart, circuitsEnd);
				} else {
					return this.projectFile.sourceGroups
						.filter((sourceGroup) => sourceGroup.Mounting === MountingFlag.FLOWN)
						.map((sourceGroup) =>
							sourceGroup.channelGroups
								.filter((channelGroup) => (channelGroup.hasLorR() ? channelGroup.isLorR() : true))
								.map((channelGroup, index) => {
									const children = channelGroup.channels.map((channel, index) =>
										handleChannel(channel, index, channelGroup, sourceGroup)
									);

									return {
										DisplayName: channelGroup.name,
										TargetId: channelGroup.groupId,
										index,
										sourceGroup,
										channelGroup,
										children
									};
								})
						)
						.flat()
						.slice(circuitStart, circuitsEnd);
				}
			case TemplateTargetTypes.ChannelGroupGround:
				if (parent && 'Mounting' in parent && parent.Mounting === MountingFlag.GROUND_STACK) {
					const sourceGroup = parent as SourceGroup;
					return sourceGroup.channelGroups
						.filter((channelGroup) => (channelGroup.hasLorR() ? channelGroup.isLorR() : true))
						.map((channelGroup, index) => handleChannelGroup(channelGroup, sourceGroup, index))
						.flat()
						.slice(circuitStart, circuitsEnd);
				} else {
					return this.projectFile.sourceGroups
						.filter((sourceGroup) => sourceGroup.Mounting === MountingFlag.GROUND_STACK)
						.map((sourceGroup) =>
							sourceGroup.channelGroups
								.filter((channelGroup) => (channelGroup.hasLorR() ? channelGroup.isLorR() : true))
								.map((channelGroup, index) => {
									const children = channelGroup.channels.map((channel, index) =>
										handleChannel(channel, index, channelGroup, sourceGroup)
									);

									return {
										DisplayName: channelGroup.name,
										TargetId: channelGroup.groupId,
										index,
										sourceGroup,
										channelGroup,
										children
									};
								})
						)
						.flat()
						.slice(circuitStart, circuitsEnd);
				}
			case TemplateTargetTypes.Channel:
				const channelGroup = parent as ChannelGroup;
				return channelGroup.channels
					.map((channel, index) => handleChannel(channel, index, channelGroup))
					.slice(circuitStart, circuitsEnd);
			case TemplateTargetTypes.Mute:
				return [
					{
						DisplayName: 'Mute',
						TargetId: this.projectFile.getMuteGroupID() || this.projectFile.getMasterGroupID()!,
						TargetChannel: TargetChannels.NONE,
						TargetType: TargetTypes.GROUP,
						index: 0
					}
				];
			case TemplateTargetTypes.Fallback:
				return [
					{
						DisplayName: 'Fallback',
						TargetId: this.projectFile.getFallbackGroupID() || this.projectFile.getMasterGroupID()!,
						TargetChannel: TargetChannels.NONE,
						TargetType: TargetTypes.GROUP,
						index: 0
					}
				];
			case TemplateTargetTypes.DS:
				return [
					{
						DisplayName: 'DS',
						TargetId: this.projectFile.getDsGroupID() || this.projectFile.getMasterGroupID()!,
						TargetChannel: TargetChannels.NONE,
						TargetType: TargetTypes.GROUP,
						index: 0
					}
				];
			case TemplateTargetTypes.AP:
				return [
					{
						DisplayName: 'AP',
						TargetId: this.projectFile.getAPGroup()?.GroupId || this.projectFile.getMasterGroupID(),
						TargetChannel: TargetChannels.NONE,
						TargetType: TargetTypes.GROUP,
						index: 0
					}
				];
			case TemplateTargetTypes.Master:
				return [
					{
						DisplayName: 'Master',
						TargetId: this.projectFile.getMasterGroupID()!,
						TargetChannel: TargetChannels.NONE,
						TargetType: TargetTypes.GROUP,
						index: 0
					}
				];
			case TemplateTargetTypes.Group:
				if (name) {
					return [
						{
							DisplayName: name,
							TargetId: this.projectFile.getGroupIdFromName(name),
							TargetChannel: TargetChannels.NONE,
							TargetType: TargetTypes.GROUP,
							index: 0
						}
					];
				}
			case TemplateTargetTypes.View:
				if (name) {
					return [
						{
							DisplayName: name,
							TargetId: this.projectFile.getViewIdFromName(name),
							TargetChannel: TargetChannels.NONE,
							TargetType: TargetTypes.VIEW,
							index: 0
						}
					];
				}
			case TemplateTargetTypes.Snapshot:
				if (name) {
					return [
						{
							DisplayName: name,
							TargetId: this.projectFile.getSnapshotFromName(name),
							TargetChannel: TargetChannels.NONE,
							TargetType: TargetTypes.SNAPSHOT,
							index: 0
						}
					];
				}
			default:
				return [];
		}
	}
}

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
	layoutManager.generateLayout();
	const renderedTemplates = layoutManager.renderedTemplates;

	renderedTemplates.forEach((template) => {
		const { name, position } = template;
		const array = [name];
		if (template.additions?.isLR) array.push('LR');
		if (template.additions?.isAP) array.push('AP');
		if (template.additions?.hasCPLv2) array.push('CPL2');

		switch (template.options?.sourceGroupType) {
			case SourceGroupTypes.ARRAY:
				array.push('Array');
				break;
			case SourceGroupTypes.POINT_SOURCE:
				array.push('PointSource');
				break;
			case SourceGroupTypes.SUBARRAY:
				array.push('SubArray');
				break;
			case SourceGroupTypes.ADDITIONAL_AMPLIFIER:
				array.push('AdditionalAmplifier');
				break;
		}

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
};
