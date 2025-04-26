import { ActionTypes, Control, ControlTypes, TargetChannels, TargetTypes } from './dbpr';

/**
 * Factory method to create default control objects based on control type
 * Default values for all controls:
 * - PosX and PosY are set to 0
 * - Font is set to "Arial,12,-1,5,50,0,0,0,0,0"
 * - JoinedId is set to 0
 * - ViewId is set to 1024
 */
export function createDefaultControl(type: ControlTypes): Partial<Control> {
	// Common default properties for all controls
	const commonDefaults = {
		PosX: 0,
		PosY: 0,
		ViewId: 1024,
		JoinedId: 0,
		Font: 'Arial,12,-1,5,50,0,0,0,0,0'
	};

	switch (type) {
		case ControlTypes.CHANNEL:
			return {
				...commonDefaults,
				Type: ControlTypes.CHANNEL,
				Width: 172,
				Height: 98,
				LimitMin: 0.0,
				LimitMax: 0.0,
				MainColor: 1,
				SubColor: 1,
				LabelColor: 1,
				LabelFont: 5,
				LabelAlignment: 64,
				LineThickness: 0,
				ThresholdValue: 0.0,
				Flags: 6,
				ActionType: ActionTypes.INTERACTION,
				TargetType: TargetTypes.DIRECT_ACCESS,
				TargetId: 0,
				TargetChannel: TargetChannels.NONE,
				TargetRecord: 65535,
				Alignment: 132
			};

		case ControlTypes.FADER:
			return {
				...commonDefaults,
				Type: ControlTypes.FADER,
				Width: 100,
				Height: 300,
				LimitMin: 0.0,
				LimitMax: 100.0,
				MainColor: 1,
				SubColor: 1,
				LabelColor: 1,
				LabelFont: 5,
				LabelAlignment: 64,
				LineThickness: 0,
				ThresholdValue: 0.0,
				Flags: 6,
				ActionType: ActionTypes.NONE,
				TargetType: TargetTypes.DIRECT_ACCESS,
				TargetId: 0,
				TargetChannel: TargetChannels.NONE,
				TargetRecord: 65535,
				Alignment: 132
			};

		case ControlTypes.DIGITAL:
			return {
				...commonDefaults,
				Type: ControlTypes.DIGITAL,
				Width: 100,
				Height: 24,
				LimitMin: 0.0,
				LimitMax: 100.0,
				MainColor: 1,
				SubColor: 1,
				LabelColor: 1,
				LabelFont: 5,
				LabelAlignment: 64,
				LineThickness: 0,
				ThresholdValue: 0.0,
				Flags: 6,
				ActionType: ActionTypes.NONE,
				TargetType: TargetTypes.DIRECT_ACCESS,
				TargetId: 0,
				TargetChannel: TargetChannels.NONE,
				TargetRecord: 65535,
				Alignment: 130
			};

		case ControlTypes.SWITCH:
			return {
				...commonDefaults,
				Type: ControlTypes.SWITCH,
				Width: 100,
				Height: 24,
				LimitMin: 0.0,
				LimitMax: 0.0,
				MainColor: 1,
				SubColor: 1,
				LabelColor: 1,
				LabelFont: 5,
				LabelAlignment: 64,
				LineThickness: 0,
				ThresholdValue: 0.0,
				Flags: 262,
				ActionType: ActionTypes.NONE,
				TargetType: TargetTypes.DIRECT_ACCESS,
				TargetId: 0,
				TargetChannel: TargetChannels.NONE,
				TargetRecord: 65535,
				Alignment: 132
			};

		case ControlTypes.LIST:
			return {
				...commonDefaults,
				Type: ControlTypes.LIST,
				Width: 100,
				Height: 24,
				LimitMin: 0.0,
				LimitMax: 0.0,
				MainColor: 1,
				SubColor: 1,
				LabelColor: 1,
				LabelFont: 5,
				LabelAlignment: 64,
				LineThickness: 0,
				ThresholdValue: 0.0,
				Flags: 6,
				ActionType: ActionTypes.NONE,
				TargetType: TargetTypes.DIRECT_ACCESS,
				TargetId: 0,
				TargetChannel: TargetChannels.NONE,
				TargetRecord: 65535,
				Alignment: 132
			};

		case ControlTypes.EQ:
			return {
				...commonDefaults,
				Type: ControlTypes.EQ,
				Width: 554,
				Height: 426,
				LimitMin: 0.0,
				LimitMax: 0.0,
				MainColor: 1,
				SubColor: 1,
				LabelColor: 1,
				LabelFont: 5,
				LabelAlignment: 64,
				LineThickness: 0,
				ThresholdValue: 0.0,
				Flags: 6,
				ActionType: ActionTypes.NONE,
				TargetType: TargetTypes.DIRECT_ACCESS,
				TargetId: 0,
				TargetChannel: TargetChannels.NONE,
				TargetRecord: 65535,
				Alignment: 132
			};

		case ControlTypes.METER:
			return {
				...commonDefaults,
				Type: ControlTypes.METER,
				Width: 24,
				Height: 290,
				LimitMin: 0.0,
				LimitMax: 100.0,
				MainColor: 1,
				SubColor: 1,
				LabelColor: 1,
				LabelFont: 5,
				LabelAlignment: 64,
				LineThickness: 0,
				ThresholdValue: 20.0,
				Flags: 134,
				ActionType: ActionTypes.NONE,
				TargetType: TargetTypes.DIRECT_ACCESS,
				TargetId: 0,
				TargetChannel: TargetChannels.NONE,
				TargetRecord: 65535,
				Alignment: 132
			};

		case ControlTypes.LED:
			return {
				...commonDefaults,
				Type: ControlTypes.LED,
				Width: 20,
				Height: 20,
				LimitMin: 0.0,
				LimitMax: 0.0,
				MainColor: 1,
				SubColor: 1,
				LabelColor: 1,
				LabelFont: 5,
				LabelAlignment: 64,
				LineThickness: 0,
				ThresholdValue: 1.0,
				Flags: 6,
				ActionType: ActionTypes.NONE,
				TargetType: TargetTypes.DIRECT_ACCESS,
				TargetId: 0,
				TargetChannel: TargetChannels.NONE,
				TargetRecord: 65535,
				Alignment: 132
			};

		case ControlTypes.DISPLAY:
			return {
				...commonDefaults,
				Type: ControlTypes.DISPLAY,
				Width: 100,
				Height: 24,
				LimitMin: 0.0,
				LimitMax: 0.0,
				MainColor: 1,
				SubColor: 1,
				LabelColor: 1,
				LabelFont: 5,
				LabelAlignment: 64,
				LineThickness: 0,
				ThresholdValue: 0.0,
				Flags: 6,
				ActionType: ActionTypes.NONE,
				TargetType: TargetTypes.DIRECT_ACCESS,
				TargetId: 0,
				TargetChannel: TargetChannels.NONE,
				TargetRecord: 65535,
				Alignment: 130
			};

		case ControlTypes.TEXT:
			return {
				...commonDefaults,
				Type: ControlTypes.TEXT,
				Width: 22,
				Height: 13.390625,
				DisplayName: 'Text',
				LimitMin: 0.0,
				LimitMax: 0.0,
				MainColor: 19,
				SubColor: 1,
				LabelColor: 1,
				LabelFont: 5,
				LabelAlignment: 64,
				LineThickness: 0,
				ThresholdValue: 0.0,
				Flags: 6,
				ActionType: ActionTypes.NONE,
				TargetType: TargetTypes.NONE,
				TargetId: 0,
				TargetChannel: TargetChannels.NONE,
				TargetRecord: 65535,
				Alignment: 132
			};

		case ControlTypes.FRAME:
			return {
				...commonDefaults,
				Type: ControlTypes.FRAME,
				Width: 320,
				Height: 240,
				LimitMin: 0.0,
				LimitMax: 0.0,
				MainColor: 17,
				SubColor: 1,
				LabelColor: 19,
				LabelFont: 5,
				LabelAlignment: 64,
				LineThickness: 0,
				ThresholdValue: 0.0,
				Flags: 70,
				ActionType: ActionTypes.NONE,
				TargetType: TargetTypes.NONE,
				TargetId: 0,
				TargetChannel: TargetChannels.NONE,
				TargetRecord: 65535,
				Alignment: 129
			};

		case ControlTypes.LINE:
			return {
				...commonDefaults,
				Type: ControlTypes.LINE,
				Width: 100,
				Height: 0,
				LimitMin: 1.0,
				LimitMax: 10.0,
				MainColor: 1,
				SubColor: 1,
				LabelColor: 1,
				LabelFont: 5,
				LabelAlignment: 64,
				LineThickness: 1,
				ThresholdValue: 0.0,
				Flags: 6,
				ActionType: ActionTypes.NONE,
				TargetType: TargetTypes.NONE,
				TargetId: 0,
				TargetChannel: TargetChannels.NONE,
				TargetRecord: 65535,
				Alignment: 132
			};

		case ControlTypes.PICTURE:
			return {
				...commonDefaults,
				Type: ControlTypes.PICTURE,
				Width: 54,
				Height: 48,
				LimitMin: 0.0,
				LimitMax: 0.0,
				MainColor: 1,
				SubColor: 1,
				LabelColor: 1,
				LabelFont: 5,
				LabelAlignment: 64,
				LineThickness: 0,
				ThresholdValue: 0.0,
				Flags: 6,
				ActionType: ActionTypes.NONE,
				TargetType: TargetTypes.NONE,
				TargetId: 0,
				TargetChannel: TargetChannels.NONE,
				TargetRecord: 65535,
				Alignment: 132
			};

		case ControlTypes.LOGO:
			return {
				...commonDefaults,
				Type: ControlTypes.LOGO,
				Width: -0.5,
				Height: -0.5,
				LimitMin: 0.0,
				LimitMax: 0.0,
				MainColor: 1,
				SubColor: 1,
				LabelColor: 1,
				LabelFont: 5,
				LabelAlignment: 64,
				LineThickness: 0,
				ThresholdValue: 0.0,
				Flags: 6,
				ActionType: ActionTypes.NONE,
				TargetType: TargetTypes.NONE,
				TargetId: 0,
				TargetChannel: TargetChannels.NONE,
				TargetRecord: 65535,
				Alignment: 132
			};

		case ControlTypes.SWITCH_MULTIPLE:
			return {
				...commonDefaults,
				Type: ControlTypes.SWITCH_MULTIPLE,
				Width: 100,
				Height: 24,
				LimitMin: 0.0,
				LimitMax: 0.0,
				MainColor: 1,
				SubColor: 1,
				LabelColor: 1,
				LabelFont: 5,
				LabelAlignment: 64,
				LineThickness: 0,
				ThresholdValue: 0.0,
				Flags: 6,
				ActionType: ActionTypes.INTERACTION,
				TargetType: TargetTypes.DIRECT_ACCESS,
				TargetId: 0,
				TargetChannel: TargetChannels.NONE,
				TargetRecord: 65535,
				Alignment: 132
			};

		case ControlTypes.MATRIX_OUTPUT:
			return {
				...commonDefaults,
				Type: ControlTypes.MATRIX_OUTPUT,
				Width: 138,
				Height: 130,
				LimitMin: 0.0,
				LimitMax: 0.0,
				MainColor: 1,
				SubColor: 1,
				LabelColor: 1,
				LabelFont: 5,
				LabelAlignment: 64,
				LineThickness: 0,
				ThresholdValue: 0.0,
				Flags: 6,
				ActionType: ActionTypes.INTERACTION,
				TargetType: TargetTypes.DIRECT_ACCESS,
				TargetId: 0,
				TargetChannel: TargetChannels.NONE,
				TargetRecord: 65535,
				Alignment: 132
			};

		case ControlTypes.MATRIX_INPUT:
			return {
				...commonDefaults,
				Type: ControlTypes.MATRIX_INPUT,
				Width: 138,
				Height: 130,
				LimitMin: 0.0,
				LimitMax: 0.0,
				MainColor: 1,
				SubColor: 1,
				LabelColor: 1,
				LabelFont: 5,
				LabelAlignment: 64,
				LineThickness: 0,
				ThresholdValue: 0.0,
				Flags: 6,
				ActionType: ActionTypes.INTERACTION,
				TargetType: TargetTypes.DIRECT_ACCESS,
				TargetId: 0,
				TargetChannel: TargetChannels.NONE,
				TargetRecord: 65535,
				Alignment: 132
			};

		case ControlTypes.MATRIX_CROSSPOINT:
			return {
				...commonDefaults,
				Type: ControlTypes.MATRIX_CROSSPOINT,
				Width: 235,
				Height: 227,
				LimitMin: 0.0,
				LimitMax: 0.0,
				MainColor: 5,
				SubColor: 0,
				LabelColor: 1,
				LabelFont: 5,
				LabelAlignment: 64,
				LineThickness: 0,
				ThresholdValue: 0.0,
				Flags: 6,
				ActionType: ActionTypes.INTERACTION,
				TargetType: TargetTypes.DIRECT_ACCESS,
				TargetId: 0,
				TargetChannel: TargetChannels.NONE,
				TargetRecord: 65535,
				Alignment: 132
			};

		case ControlTypes.CPL:
			return {
				...commonDefaults,
				Type: ControlTypes.CPL,
				Width: 530,
				Height: 410,
				LimitMin: 0.0,
				LimitMax: 0.0,
				MainColor: 14,
				SubColor: 9,
				LabelColor: 0,
				LabelFont: 5,
				LabelAlignment: 64,
				LineThickness: 0,
				ThresholdValue: 0.0,
				Flags: 6,
				ActionType: ActionTypes.INTERACTION,
				TargetType: TargetTypes.DIRECT_ACCESS,
				TargetId: 0,
				TargetChannel: TargetChannels.NONE,
				TargetRecord: 65535,
				Alignment: 132
			};

		case ControlTypes.THC:
			return {
				...commonDefaults,
				Type: ControlTypes.THC,
				Width: 530,
				Height: 410,
				LimitMin: 0.0,
				LimitMax: 0.0,
				MainColor: 5,
				SubColor: 0,
				LabelColor: 0,
				LabelFont: 5,
				LabelAlignment: 64,
				LineThickness: 0,
				ThresholdValue: 0.0,
				Flags: 6,
				ActionType: ActionTypes.INTERACTION,
				TargetType: TargetTypes.DIRECT_ACCESS,
				TargetId: 0,
				TargetChannel: TargetChannels.NONE,
				TargetRecord: 65535,
				Alignment: 132
			};

		case ControlTypes.SOUND_OBJECT_ROUTING:
			return {
				...commonDefaults,
				Type: ControlTypes.SOUND_OBJECT_ROUTING,
				Width: 235,
				Height: 132,
				LimitMin: 0.0,
				LimitMax: 0.0,
				MainColor: 5,
				SubColor: 0,
				LabelColor: 1,
				LabelFont: 5,
				LabelAlignment: 64,
				LineThickness: 0,
				ThresholdValue: 0.0,
				Flags: 6,
				ActionType: ActionTypes.INTERACTION,
				TargetType: TargetTypes.DIRECT_ACCESS,
				TargetId: 0,
				TargetChannel: TargetChannels.NONE,
				TargetRecord: 65535,
				Alignment: 132
			};

		default:
			return {
				...commonDefaults,
				Type: ControlTypes.UNKNOWN,
				Width: 100,
				Height: 24,
				LimitMin: 0.0,
				LimitMax: 0.0,
				MainColor: 1,
				SubColor: 1,
				LabelColor: 1,
				LabelFont: 5,
				LabelAlignment: 64,
				LineThickness: 0,
				ThresholdValue: 0.0,
				Flags: 6,
				ActionType: ActionTypes.NONE,
				TargetType: TargetTypes.NONE,
				TargetId: 0,
				TargetChannel: TargetChannels.NONE,
				TargetRecord: 65535,
				Alignment: 132
			};
	}
}

/**
 * Helper function to create a complete control object with a unique ID
 */
export function createControl(type: ControlTypes): Control {
	const defaultValues = createDefaultControl(type);

	return {
		ControlId: 0,
		DisplayName: defaultValues.DisplayName || null,
		UniqueName: null,
		ConfirmOnMsg: null,
		ConfirmOffMsg: null,
		TargetProperty: null,
		Dimension: null,
		...defaultValues
	} as Control;
}
