import {
	AutoR1ProjectFile,
	AutoR1TemplateFile,
	ChannelGroup,
	SourceGroup,
	TemplateOptions
} from './autor1';
import { Control, ControlTypes, Group, SourceGroupTypes, TargetTypes } from './dbpr';

type TemplateType =
	| 'SourceGroup'
	| 'BandPassGroup'
	| 'ChannelGroup'
	| 'Channel'
	| 'Mute'
	| 'Fallback'
	| 'DS'
	| 'Master'
	| 'AP';

interface Position {
	x: number;
	y: number;
}

interface Propagation {
	direction: 'horizontal' | 'vertical';
	itemLimit?: number;
	spacing: number;
}

interface TemplateControl extends Partial<Control> {
	TargetType: TargetTypes;
	Type: ControlTypes;
	DisplayName: string;
	Width: number;
	Height: number;
	Target: string;
	propagation?: Propagation;
	initialPosition: Position;
	type?: TemplateType;
	relativePosition?: Position;
}

interface TemplateBase {
	name: string;
	type?: TemplateType;
	DisplayName?: string;
	propagation?: Propagation;
}

interface TopLevelTemplate extends TemplateBase {
	initialPosition: Position;
	children?: ChildTemplate[];
}

interface ChildTemplate extends TemplateBase {
	relativePosition: Position;
}

export interface PageConfig {
	name?: string;
	paddingX?: number;
	paddingY?: number;
	templates?: TopLevelTemplate[];
	controls?: TemplateControl[];
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
	TargetChannel?: number;
	sourceGroup?: SourceGroup;
	channelGroup?: ChannelGroup;
	channel?: Group;
	sourceGroupType?: any;
	children?: ViewTemplateOptions[];
}

export class ViewTemplateManager {
	private config: PageConfig;
	private renderedTemplates: RenderedTemplate[] = [];
	public renderedControls: TemplateControl[] = [];
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

	public generateLayout(): RenderedTemplate[] {
		this.renderedTemplates = [];
		this.processTopLevelTemplates();
		return this.renderedTemplates;
	}

	private processTopLevelTemplates(): void {
		this.config.templates?.forEach((template) => {
			this.processTemplate(template, template.initialPosition);
		});

		let controlPosition = this.config.initialPosition;

		this.config.controls?.forEach((control) => {
			controlPosition = this.processControl(control, control.initialPosition, controlPosition);
			if (control.propagation?.direction === 'horizontal') {
				controlPosition.x = controlPosition.x + control.Width;
			}

			if (control.propagation?.direction === 'vertical') {
				controlPosition.x = controlPosition.x + control.Height;
			}
		});
	}

	private processTemplate(
		template: TopLevelTemplate | ChildTemplate,
		basePosition: Position,
		parent?: ViewTemplateOptions[],
		parentTemplatePos?: { x: number; y: number }
	): void {
		const options = parent || (template.type ? this.configureOptionsForType(template.type) : [{}]);

		let previousTemplatePos = parentTemplatePos;

		let insertedCount = 0;

		options.forEach((option, index) => {
			const dimensions = this.templateFile.getTemplateWidthHeight(template.name);
			const position = this.calculatePosition(
				template,
				basePosition,
				previousTemplatePos,
				dimensions,
				insertedCount
			);
			previousTemplatePos = {
				x: position.x + dimensions.width - basePosition.x,
				y: position.y + dimensions.height - basePosition.y
			};

			const isLR = !!option.sourceGroup?.channelGroups.find((cg) => cg.isLeft() || cg.isRight());
			const hasCPLv2 = !!option.sourceGroup?.hasCPLv2();
			const isAP = !!option.sourceGroup?.ArrayProcessingEnable;

			this.renderedTemplates.push({
				name: template.name,
				type: template.type,
				position: position,
				options: option,
				additions: { isLR, hasCPLv2, isAP }
			});

			(template as TopLevelTemplate).children?.forEach((childTemplate) => {
				const childBasePosition = {
					x: position.x + (childTemplate.relativePosition?.x || 0),
					y: position.y + (childTemplate.relativePosition?.y || 0)
				};
				this.processTemplate(
					childTemplate,
					childBasePosition,
					(option as any).children || undefined,
					previousTemplatePos
				);
			});

			insertedCount = insertedCount + 1;
		});
	}

	private processControl(
		control: TemplateControl,
		basePosition: Position,
		parentTemplatePos?: { x: number; y: number }
	): Position {
		const position = this.calculatePosition(control, basePosition, parentTemplatePos);

		switch (control.Type) {
			case ControlTypes.EQ:
				control.Width = 554;
				control.Height = 426;
				control.TargetProperty = TargetPropertyType.CONFIG_EQ1_ENABLE;
				control.Flags = ControlFlags.ABSOLUTE;
				control.ActionType = ActionTypes.NAVIGATION;
				break;
			case ControlTypes.SWITCH:
				control.ActionType = ActionTypes.INTERACTION;
				control.LimitMax = 1.0;
				break;
		}

		switch (control.Flag) {
			case 'Off':
				control.Flags = ControlFlags.SWITCH_OFF;
				break;
			case 'On':
				control.Flags = ControlFlags.SWITCH_ON;
				break;
			case 'Toggle':
				control.Flags = ControlFlags.SWITCH_TOGGLE;
				break;
		}

		switch (control.Property) {
			case 'EQ1':
				control.TargetProperty = TargetPropertyType.CONFIG_EQ1_ENABLE;
				break;
			case 'EQ2':
				control.TargetProperty = TargetPropertyType.CONFIG_EQ2_ENABLE;
				break;
			case 'Mute':
				control.TargetProperty = TargetPropertyType.CONFIG_MUTE;
				break;
			case 'Page':
				control.TargetProperty = null;
				break;
		}

		switch (control.Target) {
			case 'Master':
				control.TargetId = this.projectFile.getMasterGroupID();
				control.TargetChannel = TargetChannels.NONE;
				break;
			case 'Mute':
				control.TargetId = this.projectFile.getMuteGroupID();
				control.TargetChannel = TargetChannels.NONE;
				break;
			case 'AP':
				control.TargetId = this.projectFile.getAPGroup()?.TargetId;
				control.TargetChannel = TargetChannels.NONE;
				break;
			case 'Fallback':
				control.TargetId = this.projectFile.getFallbackGroupID();
				control.TargetChannel = TargetChannels.NONE;
				break;
			case 'DS':
				control.TargetId = this.projectFile.getDsGroupID();
				control.TargetChannel = TargetChannels.NONE;
				break;
			case 'EQ':
				control.TargetId = this.projectFile.getEqGroupID();
				control.TargetChannel = TargetChannels.NONE;
				break;
		}

		control.PosX = position.x;
		control.PosY = position.y;

		this.renderedControls.push(control);

		return position;
	}

	private calculatePosition(
		template: TemplateBase | TemplateControl,
		basePosition: Position,
		previousPos?: { x: number; y: number },
		dimensions?: { height: number; width: number },
		insertedCount?: number
	): Position {
		if (!template.propagation) {
			return basePosition;
		}

		const { x: prevX, y: prevY } = previousPos || { x: 0, y: 0 };

		let x =
			template.propagation.direction === 'horizontal'
				? basePosition.x + prevX + template.propagation.spacing
				: basePosition.x;
		let y =
			template.propagation.direction === 'vertical'
				? basePosition.y + prevY + template.propagation.spacing
				: basePosition.y;

		if (insertedCount && template.propagation.itemLimit && dimensions) {
			if (template.propagation.direction === 'horizontal') {
				if (insertedCount % template.propagation.itemLimit === 0) {
					x = basePosition.x;
				}
				y =
					y +
					(dimensions.height + template.propagation.spacing) *
						Math.floor(insertedCount / template.propagation.itemLimit);
			}
		}

		if (insertedCount && template.propagation.itemLimit && dimensions) {
			if (template.propagation.direction === 'vertical') {
				if (insertedCount % template.propagation.itemLimit === 0) {
					y = basePosition.y;
				}
				x =
					x +
					(dimensions.width + template.propagation.spacing) *
						Math.floor(insertedCount / template.propagation.itemLimit);
			}
		}

		return {
			x,
			y
		};
	}

	private configureOptionsForType(
		type: TemplateType,
		parent?: SourceGroup | ChannelGroup
	): ViewTemplateOptions[] {
		const handleChannel = (
			channel: Group,
			channelGroup: ChannelGroup,
			sourceGroup?: SourceGroup
		) => {
			const DisplayName = `${channel.Name} - ${this.projectFile.getCanIdFromDeviceId(
				channel.TargetId
			)} - ${['', 'A', 'B', 'C', 'D'][channel.TargetChannel]}`;
			return {
				DisplayName,
				TargetId: channel.TargetId,
				TargetChannel: channel.TargetChannel,
				sourceGroup,
				channelGroup,
				channel,
				sourceGroupType: channelGroup.type
			};
		};

		const handleChannelGroup = (channelGroup: ChannelGroup, sourceGroup: SourceGroup) => {
			const children = channelGroup.channels.map((channel) =>
				handleChannel(channel, channelGroup, sourceGroup)
			);

			return {
				DisplayName: channelGroup.name,
				TargetId: channelGroup.groupId,
				sourceGroup,
				channelGroup,
				children
			};
		};

		switch (type) {
			case 'SourceGroup':
				return this.projectFile.sourceGroups.map((sourceGroup) => {
					return {
						DisplayName: sourceGroup.Name,
						TargetId: sourceGroup.masterGroupId,
						sourceGroup,
						children: sourceGroup.channelGroups
							.filter((channelGroup) =>
								channelGroup.hasLorR() ? (channelGroup.isLorR() ? true : false) : true
							)
							.map((channelGroup) => handleChannelGroup(channelGroup, sourceGroup))
							.flat()
					};
				});
			case 'BandPassGroup':
				// let channelGroups: { channelGroup: Group; sourceGroup: SourceGroup }[] = [];
				const bandPassGroups = this.projectFile.sourceGroups
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
									group,
									sourceGroup,
									channelGroup: sourceGroup.channelGroups.length
										? sourceGroup.channelGroups[0]
										: undefined
								}
							];
						} else {
							return sourceGroup.childGroupIds.map((childGroupId) => {
								const group = this.projectFile
									.getAllGroups()
									?.find((group) => group.GroupId === childGroupId)!;

								const channelGroup = sourceGroup.childGroups.find(
									(g) => g.groupId === childGroupId
								);

								return { group, sourceGroup, channelGroup };
							});
						}
					})
					.flat();

				return bandPassGroups.map((channelGroup) => {
					return {
						DisplayName: channelGroup.group.Name,
						TargetId: channelGroup.group.GroupId,
						sourceGroup: channelGroup.sourceGroup,
						channelGroup: channelGroup.channelGroup
					};
				});
			case 'ChannelGroup':
				if ((parent as SourceGroup)?.SourceGroupId) {
					const sourceGroup = parent as SourceGroup;
					return sourceGroup.channelGroups
						.filter((channelGroup) =>
							channelGroup.hasLorR() ? (channelGroup.isLorR() ? true : false) : true
						)
						.map((channelGroup) => handleChannelGroup(channelGroup, sourceGroup))
						.flat();
				} else {
					return this.projectFile.sourceGroups
						.map((sourceGroup) =>
							sourceGroup.channelGroups
								.filter((channelGroup) =>
									channelGroup.hasLorR() ? (channelGroup.isLorR() ? true : false) : true
								)
								.map((channelGroup) => {
									const children = channelGroup.channels.map((channel) =>
										handleChannel(channel, channelGroup, sourceGroup)
									);

									return {
										DisplayName: channelGroup.name,
										TargetId: channelGroup.groupId,
										sourceGroup,
										channelGroup,
										children
									};
								})
						)
						.flat();
				}
			case 'Channel':
				const channelGroup = parent as ChannelGroup;
				return channelGroup.channels.map((channel) => handleChannel(channel, channelGroup));
			case 'Mute':
				return [
					{
						DisplayName: 'Mute',
						TargetId: this.projectFile.getMuteGroupID() || this.projectFile.getMasterGroupID()!
					}
				];
			case 'Fallback':
				return [
					{
						DisplayName: 'Fallback',
						TargetId: this.projectFile.getFallbackGroupID() || this.projectFile.getMasterGroupID()!
					}
				];
			case 'DS':
				return [
					{
						DisplayName: 'DS',
						TargetId: this.projectFile.getDsGroupID() || this.projectFile.getMasterGroupID()!
					}
				];
			case 'AP':
				const TargetId =
					this.projectFile.getAPGroup()?.GroupId || this.projectFile.getMasterGroupID();
				return [
					{
						DisplayName: 'AP',
						TargetId
					}
				];
			case 'Master':
				return [{ DisplayName: 'Master', TargetId: this.projectFile.getMasterGroupID()! }];
			default:
				return [];
		}
	}
}
