import {
	ActionTypes,
	Control,
	ControlTypes,
	TargetChannels,
	TargetPropertyType,
	TargetTypes
} from '../dbpr';

export class SqlDbFileStub {
	public db: any;

	static build = (fb: Buffer) => new SqlDbFileStub(fb);

	constructor(db: any) {
		this.db = db;
	}

	/**
	 * Close the database connection. This can fail on Windows in some cases.
	 */
	public close(): void {
		return;
	}
}

export class TemplateFileStub extends SqlDbFileStub {
	constructor(db: any) {
		super(db);
	}

	static build = (fb: Buffer) => new TemplateFileStub(fb);

	/**
	 * Get all controls from a template
	 * @param tempName Name of template
	 * @returns Array of controls
	 * @throws Will throw an error if the template cannot be found.
	 *
	 * @example
	 * const t = new TemplateFile('path/to/template.r1t');
	 * const controls = t.getTemplateControlsByName('Template 1');
	 * console.log(controls);
	 * // => [{...}, {...}, ...]
	 */
	getTemplateControlsByName(tempName: string): Control[] | undefined {
		const control: Control = {
			ControlId: 1,
			Type: ControlTypes.FADER,
			PosX: 100,
			PosY: 200,
			Width: 50,
			Height: 150,
			ViewId: 1,
			DisplayName: 'Mock Control',
			UniqueName: 'mock_control_1',
			JoinedId: 0,
			LimitMin: 0,
			LimitMax: 100,
			MainColor: 0xffffff,
			SubColor: 0x000000,
			LabelColor: 0x808080,
			LabelFont: 1,
			LabelAlignment: 1,
			LineThickness: 2,
			ThresholdValue: 50,
			Flags: 0,
			ActionType: ActionTypes.INTERACTION,
			TargetType: TargetTypes.CHANNEL,
			TargetId: 1,
			TargetChannel: TargetChannels.CHANNEL_A,
			TargetProperty: TargetPropertyType.CHANNEL_STATUS_GAIN_REDUCTION,
			TargetRecord: 0,
			ConfirmOnMsg: 'Turned On',
			ConfirmOffMsg: 'Turned Off',
			PictureIdDay: 1,
			PictureIdNight: 2,
			Font: 'Arial,12,-1,5,50,0,0,0,0,0',
			Alignment: 0,
			Dimension: new Uint8Array([1, 2, 3, 4])
		};

		return [control];
	}
}
