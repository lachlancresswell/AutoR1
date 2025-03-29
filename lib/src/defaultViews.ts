import type { PageConfig } from './ViewTemplateManager';
import * as dbpr from './dbpr';
import * as AutoR1 from '@autor1/lib';

export const config: PageConfig[] = [
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
