import SQLjs, { Database } from 'sql.js';

export type Crossover = '100hz' | 'Infra' | 'CUT';

export const ARRAYCALC_SNAPSHOT = 1;  // Snapshot ID
export const INPUT_TYPES = ["A1", "A2", "A3", "A4", "D1", "D2", "D3", "D4"];

export const MASTER_GROUP_ID = 1;

export enum SourceGroupTypes {
    ARRAY = 1,
    POINT_SOURCE = 2,
    SUBARRAY = 3,
    ADDITIONAL_AMPLIFIER = 4,
    UNUSED_CHANNELS = 5,
}

export enum ArrayProcessingFlag {
    DISABLED = 0,
    ENABLED = 1,
}

export enum SymmetricFlag {
    DISABLED = 0,
    ENABLED = 1,
}

export enum MountingFlag {
    FLOWN = 0,
    GROUND_STACK = 1,
}

export enum R1GroupsType {
    GROUP = 0,
    DEVICE = 1
}

/**
 * Source group row from database
 * 
 export * @interface SourceGroupRow
 * @property SourceGroupId - Unique source group ID
 * @property Type - Source group type
 * @property Name - Source group name
 * @property OrderIndex - Order of source group in ArrayCalc sources tab list. -1 for right side of stereo pair.
 * @property RemarkableChangeDate - Date of last change
 * @property NextSourceGroupId - SourceGroupId of the accompanying group of a stereo pair
 * @property ArrayProcessingEnable - Flag indicating if array processing is enabled
 * @property ArraySightId - Source group array sight ID
 * @property LinkMode - Source group link mode
 * @property Symmetric - Flag indicating if source group is symmetric or not
 * @property Mounting - Flag indicating if source group is flown or ground stacked
 * @property RelativeDelay - Source group relative delay in ms
 */
export interface SourceGroup {
    SourceGroupId: number;
    Type: SourceGroupTypes;
    Name: string;
    OrderIndex: number;
    RemarkableChangeDate: number;
    NextSourceGroupId: number;
    ArrayProcessingEnable: ArrayProcessingFlag;
    ArraySightId: number;
    LinkMode: number;
    Symmetric: SymmetricFlag;
    Mounting: MountingFlag;
    RelativeDelay: number | null;
}

export enum ControlTypes {
    UNKNOWN = 0,
    CHANNEL = 1,
    FADER = 2,
    DIGITAL = 3,
    SWITCH = 4,
    LIST = 5,
    EQ = 6,
    METER = 7,
    LED = 8,
    DISPLAY = 9,
    TEXT = 11,
    FRAME = 12,
    LINE = 13,
    PICTURE = 14,
    LOGO = 15,
    SWITCH_MULTIPLE = 16,
    MATRIX_OUTPUT = 31,
    MATRIX_INPUT = 32,
    MATRIX_CROSSPOINT = 33,
    CPL = 38,
    THC = 39,
    SOUND_OBJECT_ROUTING = 40,
}

export enum ControlFlags {
    ABSOLUTE = 6,
    RELATIVE = 14
}

/**
 * NONE for Controls of Type TEXT, FRAME and LOGO
 * DEVICE for main device controls
 * CHANNEL_x for channel specific controls
 */
export enum TargetChannels {
    NONE = -1,
    DEVICE = 0,
    CHANNEL_A = 1,
    CHANNEL_B = 2,
    CHANNEL_C = 3,
    CHANNEL_D = 4,
}

export enum TargetTypes {
    GROUP = 0,
    CHANNEL = 1,
    DIRECT_ACCESS = 2,
    SNAPSHOT = 3,
    SYSTEM_SETTINGS = 4,
    VIEW = 5,
    SCENE = 6,
    SCENE_TRANSPORT = 7,
}

export enum ActionTypes {
    NONE = 0,
    INTERACTION = 1,
    NAVIGATION = 2,
}

export enum TargetPropertyType {
    ARRAYPROCESSING_NAME = "ArrayProcessing_Name",
    ARRAYPROCESSING_COMMENT = "ArrayProcessing_Comment",
    ARRAYPROCESSING_ENABLE = "ArrayProcessing_Enable",
    CHANNEL_STATUS_AMP_TEMPERATURE = "ChStatus_AmpTemperature",
    CHANNEL_STATUS_GAIN_REDUCTION_HEADROOM = "ChStatus_GrHead",
    CHANNEL_STATUS_MS_DELAY = "ChStatus_MsDelay",
    CHANNEL_STATUS_SPEAKER_IMPEDANCE = "ChStatus_SpeakerImpedance",
    CHANNEL_STATUS_GAIN_REDUCTION = "ChStatus_RemHold_GR",
    CHANNEL_STATUS_ERROR_TEXT = "ChErr_ErrorText",
    CHANNEL_STATUS_INPUT_VOLTAGE = "ChStatus_InputVoltage",
    CHANNEL_STATUS_INPUT_VOLTAGE_PEAK = "ChStatus_InputVoltagePeak",
    CHANNEL_STATUS_OUTPUT_POWER = "ChStatus_OutputPower",
    CHANNEL_STATUS_OUTPUT_POWER_PEAK = "ChStatus_OutputPowerPeak",
    CHANNEL_ERROR_AMP_PROTECTION = "ChErr_AmpProt",
    CHANNEL_ERROR_AMP_TEMP_OFF = "ChErr_AmpTempOff",
    CHANNEL_ERROR = "ChErr_AmpTempWarn",
    CHANNEL_ERROR_CHANNEL_ERROR = "ChErr_ChannelErr",
    CHANNEL_STATUS_REM_HOLD_GR = "ChStatus_RemHold_Gr",
    CHANNEL_STATUS_ISP = "ChStatus_Isp",
    CHANNEL_STATUS_REM_HOLD_OVL = "ChStatus_RemHold_Ovl",
    CONFIG_CHANNEL_NAME = "Config_ChannelName",
    CONFIG_DELAY_ON = "Config_DelayOn",
    CONFIG_FREQ_GEN_FREQ = "Config_FreqGenFreq",
    CONFIG_FREQ_GEN_LEVEL = "Config_FreqGenLevel",
    CONFIG_EQ1_ENABLE = "Config_Eq1Enable",
    CONFIG_EQ2_ENABLE = "Config_Eq2Enable",
    CONFIG_FILTER1 = "Config_Filter1",
    CONFIG_FILTER2 = "Config_Filter2",
    CONFIG_FILTER3 = "Config_Filter3",
    CONFIG_FILTER4 = "Config_Filter4",
    CONFIG_FILTER5 = "Config_Filter5",
    CONFIG_FILTER6 = "Config_Filter6",
    CONFIG_CUT = "Config_Filter1",
    CONFIG_HFC = "Config_Filter2",
    CONFIG_LEVEL = "Config_PotiLevel",
    CONFIG_INPUT_ENABLE_1 = "Config_InputEnable1",
    CONFIG_INPUT_ENABLE_2 = "Config_InputEnable2",
    CONFIG_INPUT_ENABLE_3 = "Config_InputEnable3",
    CONFIG_INPUT_ENABLE_4 = "Config_InputEnable4",
    CONFIG_INPUT_ENABLE_5 = "Config_InputEnable5",
    CONFIG_INPUT_ENABLE_6 = "Config_InputEnable6",
    CONFIG_INPUT_ENABLE_7 = "Config_InputEnable7",
    CONFIG_INPUT_ENABLE_8 = "Config_InputEnable8",
    CONFIG_LOAD_MATCH_CABLE_CROSS_SECTION = "Config_LoadMatchCableCrossSection",
    CONFIG_LOAD_MATCH_CABLE_LENGTH = "Config_LoadMatchCableLength",
    CONFIG_LOAD_MATCH_ENABLE = "Config_LoadMatchEnable",
    CONFIG_LOAD_MATCH_SPEAKER_COUNT = "Config_LoadMatchSpeakerCount",
    CONFIG_MUTE = "Config_Mute",
    CONFIG_POTI_LEVEL = "Config_PotiLevel",
    ERROR_GENERAL_ERR = "Error_GnrlErr",
    ERROR_ERROR_TEXT = "Error_ErrorText",
    ERROR_SMPS_TEMP_OFF = "Error_SmpsTempOff",
    ERROR_SMPS_TEMP_WARN = "Error_SmpsTempWarn",
    INPUT_MONITORING_DIGITAL_DETECTION_TIME = "InputMonitoring_Digital_DetectionTime",
    INPUT_MONITORING_DIGITAL_ENABLE = "InputMonitoring_Digital_Enable",
    INPUT_MONITORING_DIGITAL_MODE = "InputMonitoring_Digital_Mode",
    INPUT_ANALOG_GAIN = "Input_Analog_Gain",
    INPUT_DIGITAL_GAIN = "Input_Digital_Gain",
    INPUT_DIGITAL_MODE = "Input_Digital_Mode",
    INPUT_DIGITAL_SYNC = "Input_Digital_Sync",
    INPUT_DIGITAL_SAMPLE_STATUS = "Input_Digital_SampleStatus",
    INPUT_DIGITAL_DS_DATA_PRI = "Input_Digital_DsDataPri",
    INPUT_DIGITAL_DS_DATA_SEC = "Input_Digital_DsDataSec",
    INPUT_DIGITAL_TX_STREAM = "Input_Digital_TxStream",
    SETTINGS_INPUT_FALLBACK_MODE = "Settings_InputFallbackMode",
    SETTINGS_POWER_ON = "Settings_PwrOn",
    SETTINGS_BUZZER = "Settings_Buzzer",
    SETTINGS_DEVICE_NAME = "Settings_DeviceName",
    SETTINGS_INPUT_GAIN_ENABLE = "Settings_InputGainEnable",
    SETTINGS_LOCK_CMD = "Settings_LockCmd",
    SETTINGS_MCL_ENABLE = "Settings_MCLEnable",
    SETTINGS_MCL_VALUE = "Settings_MCLValue",
    STATUS_HUMIDITY = "Status_Humidity",
    STATUS_INPUT_FALLBACK_ACTIVE = "Status_InputFallbackActive",
    STATUS_TEMPERATURE = "Status_Temperature",
    STATUS_SMPS_FREQUENCY = "Status_SmpsFrequency",
    STATUS_MAINS_POWER_PEAK = "Status_MainsPowerPeak",
    STATUS_SMPS_VOLTAGE = "Status_SmpsVoltage",
    STATUS_SMPS_TEMPERATURE = "Status_SmpsTemperature",
    STATUS_LOCK_MODE = "Status_LockMode",
    STATUS_STATUS_TEXT = "Status_StatusText",
    STATUS_POWER_OK = "Status_PwrOk",
    STATUS_CO_TEMPERATURE = "Status_CoTemperature",
};

/**
 * Allowed TargetProperty values for the Channel control type targeting a Channel
 */
export const TargetPropertyTypeChannel = {
    CHANNEL_STATUS_AMP_TEMPERATURE: "ChStatus_AmpTemperature",
    CHANNEL_STATUS_GAIN_REDUCTION_HEADROOM: "ChStatus_GrHead",
    CHANNEL_STATUS_MS_DELAY: "ChStatus_MsDelay",
    CHANNEL_STATUS_SPEAKER_IMPEDANCE: "ChStatus_SpeakerImpedance",
    CHANNEL_STATUS_OVL: "ChStatus_RemHold_Ovl",
    CHANNEL_STATUS_GAIN_REDUCTION: "ChStatus_RemHold_GR",
}

/**
 * Allowed TargetProperty values for the Digital control type targeting a Channel
 */
export const TargetPropertyDigitalChannel = {
    CHANNEL_STATUS_MS_DELAY: "ChStatus_MsDelay",
    CONFIG_FREQ_GEN_FREQ: "Config_FreqGenFreq",
    CONFIG_FREQ_GEN_LEVEL: "Config_FreqGenLevel",
    CONFIG_FILTER2: "Config_Filter2",
    CONFIG_LOAD_MATCH_CABLE_CROSS_SECTION: "Config_LoadMatchCableCrossSection",
    CONFIG_LOAD_MATCH_CABLE_LENGTH: "Config_LoadMatchCableLength",
    CONFIG_LOAD_MATCH_SPEAKER_COUNT: "Config_LoadMatchSpeakerCount",
}

/**
 * Allowed TargetProperty values for the Display control type targeting a Channel
 */
export const TargetPropertyDisplayChannel = {
    ARRAYPROCESSING_COMMENT: "ArrayProcessing_Comment",
    ARRAYPROCESSING_NAME: "ArrayProcessing_Name",
    CHANNEL_STATUS_AMP_TEMPERATURE: "ChStatus_AmpTemperature",
    CHANNEL_STATUS_ERROR_TEXT: "ChErr_ErrorText",
    CHANNEL_STATUS_CHANNEL_NAME: "Config_ChannelName",
    CHANNEL_STATUS_MS_DELAY: "ChStatus_MsDelay",
    CHANNEL_STATUS_INPUT_VOLTAGE: "ChStatus_InputVoltage",
    CHANNEL_STATUS_INPUT_VOLTAGE_PEAK: "ChStatus_InputVoltagePeak",
    CHANNEL_STATUS_LEVEL: "Config_PotiLevel",
    CHANNEL_STATUS_OUTPUT_POWER: "ChStatus_OutputPower",
    CHANNEL_STATUS_OUTPUT_POWER_PEAK: "ChStatus_OutputPowerPeak",
    CHANNEL_STATUS_SPEAKER_IMPEDANCE: "ChStatus_SpeakerImpedance",
}

/**
 * Allowed TargetProperty values for the LED control type targeting a Channel
 */
export const TargetPropertyLedChannel = {
    ARRAYPROCCESING_ENABLE: "ArrayProcessing_Enable",
    CHANNEL_ERROR_AMP_PROTECTION: "ChErr_AmpProt",
    CHANNEL_ERROR_AMP_TEMP_OFF: "ChErr_AmpTempOff",
    CHANNEL_ERROR: "ChErr_AmpTempWarn",
    CHANNEL_ERROR_CHANNEL_ERROR: "ChErr_ChannelErr",
    CONFIG_DELAY_ON: "Config_DelayOn",
    CHANNEL_STATUS_REM_HOLD_GR: "ChStatus_RemHold_Gr",
    CHANNEL_STATUS_ISP: "ChStatus_Isp",
    CONFIG_MUTE: "Config_Mute",
    CHANNEL_STATUS_REM_HOLD_OVL: "ChStatus_RemHold_Ovl",
};

/**
 * Allowed TargetProperty values for the Display control type targeting a Device
 */
export const TargetPropertyDisplayDevice = {
    ERROR_ERROR_TEXT: "Error_ErrorText",
    SETTINGS_DEVICE_NAME: "Settings_DeviceName",
    INPUT_DIGITAL_SYNC: "Input_Digital_Sync",
    INPUT_DIGITAL_SAMPLE_STATUS: "Input_Digital_SampleStatus",
    STATUS_SMPS_FREQUENCY: "Status_SmpsFrequency",
    STATUS_MAINS_POWER_PEAK: "Status_MainsPowerPeak",
    STATUS_SMPS_VOLTAGE: "Status_SmpsVoltage",
    STATUS_SMPS_TEMPERATURE: "Status_SmpsTemperature",
    STATUS_STATUS_TEXT: "Status_StatusText",
};

/**
 * Allowed TargetProperty values for the Digital control type targeting a Device
 */
export const TargetPropertyDigitalDevice = {
    INPUT_ANALOG_GAIN: "Input_Analog_Gain",
    INPUT_DIGITAL_GAIN: "Input_Digital_Gain",
    SETTINGS_MCL_VALUE: "Settings_MCLValue",
};

/**
 * Allowed TargetProperty values for the LED control type targeting a Device
 */
export const TargetPropertyLedDevice = {
    SETTINGS_BUZZER: "Settings_Buzzer",
    ERROR_GENERAL_ERROR: "Error_GnrlErr",
    SETTINGS_LOCK_CMD: "Settings_LockCmd",
    STATUS_LOCK_MODE: "Status_LockMode",
    SETTINGS_POWER_ON: "Settings_PwrOn",
    STATUS_POWER_OK: "Status_PwrOk",
    ERROR_SMPS_TEMP_OFF: "Error_SmpsTempOff",
    ERROR_SMPS_TEMP_WARN: "Error_SmpsTempWarn",
};

/**
 * Allowed TargetProperty values for the Switch control type targeting a Channel
 */
export const TargetPropertySwitchChannel = {
    ARRAYPROCESSING_ENABLE: "ArrayProcessing_Enable",
    CONFIG_FILTER1: "Config_Filter1",
    CONFIG_DELAY_ON: "Config_DelayOn",
    CONFIG_EQ1_ENABLE: "Config_Eq1Enable",
    CONFIG_EQ2_ENABLE: "Config_Eq2Enable",
    CONFIG_INPUT_ENABLE_1: "Config_InputEnable1",
    CONFIG_INPUT_ENABLE_2: "Config_InputEnable2",
    CONFIG_INPUT_ENABLE_3: "Config_InputEnable3",
    CONFIG_INPUT_ENABLE_4: "Config_InputEnable4",
    CONFIG_INPUT_ENABLE_5: "Config_InputEnable5",
    CONFIG_INPUT_ENABLE_6: "Config_InputEnable6",
    CONFIG_INPUT_ENABLE_7: "Config_InputEnable7",
    CONFIG_INPUT_ENABLE_8: "Config_InputEnable8",
    CONFIG_LOAD_MATCH_ENABLE: "Config_LoadMatchEnable",
    CONFIG_MUTE: "Config_Mute",
};

/**
 * Allowed TargetProperty values for the Switch control type targeting a Device
 */
export const TargetPropertySwitchDevice = {
    SETTINGS_BUZZER: "Settings_Buzzer",
    SETTINGS_INPUT_GAIN_ENABLE: "Settings_InputGainEnable",
    SETTINGS_LOCK_CMD: "Settings_LockCmd",
    SETTINGS_MCL_ENABLE: "Settings_MCLEnable",
    SETTINGS_POWER_ON: "Settings_PwrOn",
};

/**
 * Allowed TargetProperty values for the Meter control type targeting a Channel
 */
export const TargetPropertyMeterChannel = {
    CHANNEL_STATUS_AMP_TEMPERATURE: "ChStatus_AmpTemperature",
    CHANNEL_STATUS_GAIN_REDUCTION_HEADROOM: "ChStatus_GrHead",
    CHANNEL_STATUS_INPUT_VOLTAGE: "ChStatus_InputVoltage",
    CHANNEL_STATUS_INPUT_VOLTAGE_PEAK: "ChStatus_InputVoltagePeak",
    CHANNEL_STATUS_LEVEL: "Config_PotiLevel",
    CHANNEL_STATUS_OUTPUT_POWER: "ChStatus_OutputPower",
    CHANNEL_STATUS_OUTPUT_POWER_PEAK: "ChStatus_OutputPowerPeak",
    CHANNEL_STATUS_SPEAKER_IMPEDANCE: "ChStatus_SpeakerImpedance",
};

/**
 * Allowed TargetProperty values for the Meter control type targeting a Device
 */
export const TargetPropertyMeterDevice = {
    STATUS_CO_TEMPERATURE: "Status_CoTemperature",
    STATUS_SMPS_FREQUENCY: "Status_SmpsFrequency",
    STATUS_MAINS_POWER_PEAK: "Status_MainsPowerPeak",
    STATUS_SMPS_VOLTAGE: "Status_SmpsVoltage",
    STATUS_SMPS_TEMPERATURE: "Status_SmpsTemperature",
};

/**
 * Row from the Controls table
 * @param ControlId - Unique ID of the control
 * @param Type - Type of the control
 * @param PosX - X position of the control
 * @param PosY - Y position of the control
 * @param Width - Width of the control
 * @param Height - Height of the control
 * @param ViewId - View the control is located on
 * @param DisplayName - Name of the control, if applicable
 * @param UniqueName - ?
 * @param JoinedId - ID shared by controls that have been joined together
 * @param LimitMin - Minimum value of the control, if applicable
 * @param LimitMax - Maximum value of the control, if applicable
 * @param MainColor - Main color of the control
 * @param SubColor - Sub color of the control
 * @param LabelColor - Label color of the control
 * @param LabelFont - Label font of the control
 * @param LabelAlignment - ?
 * @param LineThickness - Thickness of the line, if applicable
 * @param ThresholdValue - Threshold value of the control, if applicable
 * @param Flags - ?
 * @param ActionType - ?
 * @param TargetType - Type of the targeted object to control/trigger/effect
 * @param TargetId - ID of the targeted object to control/trigger/effect. Can be a Group ID, Amplifier ID, View ID or Snapshot ID
 * @param TargetChannel - Channel of the targeted amplifier. Only set if TargetType is 2, otherwise is -1.
 * @param TargetProperty - Property of the targeted object to control/trigger/effect
 * @param TargetRecord - Used to index the TargetProperty, if applicable
 * @param ConfirmOnMsg - Message to display when the control is turned on, if applicable
 * @param ConfirmOffMsg - Message to display when the control is turned off, if applicable
 * @param PictureIdDay - ID of the picture to display during the day, if applicable
 * @param PictureIdNight - ID of the picture to display during the night, if applicable
 * @param Font - Font of the control
 * @param Alignment - ?
 * @param Dimension - ?
 */
export interface Control {
    ControlId: number;
    Type: ControlTypes;
    PosX: number;
    PosY: number;
    Width: number;
    Height: number;
    ViewId: number;
    DisplayName: string | null;
    UniqueName: string | null;
    JoinedId: number;
    LimitMin: number;
    LimitMax: number;
    MainColor: number;
    SubColor: number;
    LabelColor: number;
    LabelFont: number;
    LabelAlignment: number;
    LineThickness: number;
    ThresholdValue: number;
    Flags: number;
    ActionType: ActionTypes;
    TargetType: TargetTypes;
    TargetId: number;
    TargetChannel: TargetChannels;
    TargetProperty: TargetPropertyType | null;
    TargetRecord: number;
    ConfirmOnMsg: string | null;
    ConfirmOffMsg: string | null;
    PictureIdDay: number;
    PictureIdNight: number;
    Font: string;
    Alignment: number;
    Dimension: Uint8Array | null;
}

export enum ViewTypes {
    UNKNOWN = 0,
    HOME_VIEW = 1,
    DEVICES_VIEW = 2,
    GROUPS_VIEW = 3,
    SERVICE_VIEW = 4,
    PARTS_LIST_VIEW = 5,
    RIGGING_PLOT_VIEW = 6,
    ALIGNMENT_VIEW = 7,
    PATCH_VIEW = 8,
    PLOT_VIEW = 9,
    VENUE_VIEW = 10,
    SOURCES_VIEW = 11,
    SNAPSHOTS_VIEW = 12,
    ARRAYPROCESSING_VIEW = 13,
    SYSTEM_CHECK_VIEW = 14,
    SYSTEM_LOG_VIEW = 15,
    SCENES_VIEW = 16,
    DEVICE_REDUNDANCY_VIEW = 17,
    REMOTE_VIEW = 1000,
    POSITIONING_VIEW = 1001,
    LARGE_EQ_VIEW = 1002,
};

/**
 * Row from the Views table
 * @param ViewId - Unique ID of the view. Starts at 1 for default system views, 1000 for remote views
 * @param Type - Type of the view
 * @param Name - Name of the view
 * @param Icon - Icon of the view
 * @param Flags - ?
 * @param HomeViewIndex - Index of the view in the home screen
 * @param NaviBarIndex - Index of the view in the navigation bar
 * @param HRes - Horizontal resolution of the view
 * @param VRes - Vertical resolution of the view
 * @param ZoomLevel - Zoom level of the view
 * @param ScalingFactor - Scaling factor of the view
 * @param ScalingPosX - Scaling position X of the view
 * @param ScalingPosY - Scaling position Y of the view
 * @param ReferenceVenueObjectId - ?
 */
export interface View {
    ViewId: number;
    Type: ViewTypes;
    Name: string;
    Icon: any,
    Flags: number;
    HomeViewIndex: number;
    NaviBarIndex: number;
    HRes: number | null;
    VRes: number | null;
    ZoomLevel: number | null;
    ScalingFactor: number | null;
    ScalingPosX: number | null;
    ScalingPosY: number | null;
    ReferenceVenueObjectId: any,
};


/**
 * Row from the Groups table
 * @param GroupId - Unique ID of the group
 * @param Name - Name of the group
 * @param ParentId - ID of the parent group
 * @param TargetId - ID of the target object. Can be a group or a device ID.
 * @param TargetChannel - Channel of the target amplifier. -1 if Type is 0, otherwise a number between 1 and 4.
 * @param Type - Type of the group. 0 if target is a group, 1 if target is a device.
 * @param Flags - ?
 */
export interface Group {
    GroupId: number;
    Name: string;
    ParentId: number;
    TargetId: number;
    TargetChannel: TargetChannels;
    Type: R1GroupsType;
    Flags: number;
}

/**
 * Gets all available rows from a statement as an array of objects
 * @param stmt Statement to execute
 * @param bindObj Object to bind to the statement
 * @returns An array of objects
 */
export const getAllAsObjects = <T>(stmt: SQLjs.Statement, bindObj: any[] = []) => {
    let rows: T[] = [];

    stmt.bind(bindObj);

    while (stmt.step()) {
        const row = stmt.getAsObject() as T;
        rows.push(row);
    }

    stmt.free();

    return rows;
}

/**
 * Load existing SQL database file
 * @param fb - Database file in Buffer form
 */
const build = async <T>(fb: Buffer, cb: (db: Database) => T) => {
    const sql: SQLjs.SqlJsStatic = (await SQLjs({
        // locateFile: file => `https://sql.js.org/dist/${file}`
    }))
    const db = new sql.Database(fb)
    return cb(db);
}

export class SqlDbFile {
    public db: SQLjs.Database;

    static build = (fb: Buffer) => build<SqlDbFile>(fb, (db) => new SqlDbFile(db))

    constructor(db: SQLjs.Database) {
        this.db = db;
    }

    /**
     * Close the database connection. This can fail on Windows in some cases.
     */
    public close(): void {
        try {
            this.db.run('journal_mode = DELETE');
        } catch (err) {
            // Ignored
        }

        this.db.close();
    }
}

const insertControlQuery = `INSERT INTO Controls ('Type', 
                            'PosX', 
                            'PosY', 
                            'Width', 
                            'Height', 
                            'ViewId', 
                            'DisplayName', 
                            'UniqueName', 
                            'JoinedId', 
                            'LimitMin',
                            'LimitMax', 
                            'MainColor', 
                            'SubColor', 
                            'LabelColor', 
                            'LabelFont', 
                            'LabelAlignment', 
                            'LineThickness', 
                            'ThresholdValue', 
                            'Flags', 
                            'ActionType', 
                            'TargetType', 
                            'TargetId', 
                            'TargetChannel', 
                            'TargetProperty', 
                            'TargetRecord', 
                            'ConfirmOnMsg', 
                            'ConfirmOffMsg', 
                            'PictureIdDay', 
                            'PictureIdNight', 
                            'Font', 
                            'Alignment', 
                            'Dimension') VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`


export class ProjectFile extends SqlDbFile {
    static build = (fb: Buffer) => build<ProjectFile>(fb, (db) => new ProjectFile(db))

    constructor(db: SQLjs.Database) {
        super(db);

        if (!this.getMasterGroupID()) {
            throw (new Error("Project file is not initialised"));
        }
    }

    /**
     * Creates a new group with the given title and properties, and returns its GroupId.
     * @param Name The name of the new group.
     * @param ParentId The GroupId of the parent group. Defaults to 1 (the Main group).
     * @param TargetId The target ID of the new group. Defaults to 0.
     * @param TargetChannel The target channel of the new group. Defaults to -1.
     * @param Type The type of the new group. Defaults to 0.
     * @param Flags The flags of the new group. Defaults to 0.
     * @returns The GroupId of the newly created group.
     * @throws Will throw an error if the newly created group cannot be found
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const groupId = p.createGrp({
     * Name: 'My Group', 
     * ParentId: 2,
     * });
     * console.log(groupId);
     * // => 284
     */
    public createGroup(groupObj: {
        Name: string,
        ParentId?: number,
        TargetId?: number,
        TargetChannel?: TargetChannels,
        Type?: R1GroupsType,
        Flags?: number,
    }): number {
        const defaults = {
            ParentId: MASTER_GROUP_ID,
            TargetId: 0,
            TargetChannel: TargetChannels.NONE,
            Type: R1GroupsType.GROUP,
            Flags: 0,
        }

        const {
            Name,
            ParentId,
            TargetId,
            TargetChannel,
            Type,
            Flags,
        } = { ...defaults, ...groupObj };

        const insertGroupStmt = this.db.prepare(
            `INSERT INTO Groups (Name, ParentId, TargetId, TargetChannel, Type, Flags)
             SELECT ?, ?, ?, ?, ?, ?`
        )
        insertGroupStmt.run([Name, ParentId, TargetId, TargetChannel, Type, Flags]);

        const selectAllGroupsStmt = this.db.prepare('SELECT * FROM Groups ORDER BY GroupId DESC LIMIT 1;')
        const rtn = selectAllGroupsStmt.getAsObject({}) as any as Group;

        if (!rtn || rtn.GroupId === undefined) {
            throw new Error('Could not create group');
        }

        return rtn.GroupId;
    }

    /**
     * Adds a channel to a group
     * @param Name The name of the channel
     * @param ParentId The GroupId of the parent group. Defaults to 1 (the Main group).
     * @param TargetId The target ID of the new group. Defaults to 0.
     * @param TargetChannel The target channel of the new group. Defaults to -1.
     * @param Flags The flags of the new group. Defaults to 0.
     * @returns The GroupId of the newly inserted channel.
     * @throws Will throw an error if the parent group does not exist.
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const groupId = p.addChannelToGroup({
     * Name: 'My Channel', 
     * ParentId: 2,
     * TargetId: 0,
     * TargetChannel: -1
     * });
     * console.log(groupId);
     * // => 284
     */
    public addChannelToGroup(groupObj: {
        Name: string,
        ParentId: number,
        TargetId: number,
        TargetChannel: TargetChannels,
        Flags?: number,
    }): number {
        const defaults = {
            Type: R1GroupsType.DEVICE,
            Flags: 0,
        }

        return this.createGroup({ ...defaults, ...groupObj });
    }

    /**
     * Recursively delete a group and all its children
     * @param groupID GroupId
     * @returns true if group is found and deleted, false if not
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * p.deleteGroup(1);
     */
    public deleteGroup(groupID: number): void {
        // Remove all children first
        const childrenStmt = this.db.prepare('SELECT GroupId FROM Groups WHERE ParentId = ?');
        const children = getAllAsObjects<{ GroupId: number }>(childrenStmt, [groupID]);

        if (!children.length) {
            console.debug(`Could not find any groups with ParentID ${groupID}`);
        } else {
            for (const child of children) {
                this.deleteGroup(child.GroupId);
            }
        }

        // Delete group
        const deleteStmt = this.db.prepare('DELETE FROM Groups WHERE GroupId = ?');
        deleteStmt.run([groupID]);
    }

    /**
     * Get the ID of the master group
     * @returns GroupId of master group or undefined if not found
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const masterId = p.getMasterID();
     * console.log(masterId);
     * // => 1
     */
    public getMasterGroupID(): number | undefined {
        const stmt = this.db.prepare("SELECT GroupId FROM Groups WHERE ParentId = ? AND Name = ?");
        const rtn = stmt.getAsObject([1, 'Master']) as any as { GroupId: number };
        if (!rtn || rtn.GroupId === undefined) {
            console.error('Cannot find Master group');
            return undefined;
        }
        return rtn.GroupId;
    }

    /**
     * Get the name of a source group from its ID
     * @param id SourceGroupId
     * @returns Name of source group or undefined if not found
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const sourceGroupName = p.getSourceGroupNameFromId(1);
     * console.log(sourceGroupName);
     * // => 'Unused channels'
     */
    public getSourceGroupNameFromID(id: number): string | undefined {
        const stmt = this.db.prepare('SELECT Name from SourceGroups WHERE SourceGroupId = ?');
        const rtn = stmt.getAsObject([id]) as any as { Name: string };
        if (!rtn || rtn.Name === undefined) {
            console.warn(`Could not find SourceGroup with ID ${id}`);
            return undefined;
        }
        return rtn.Name;
    }

    /**
     * Get the controls from a view from the view ID
     * @param viewId ViewId
     * @returns Array of controls or undefined if no controls are found
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const controls = p.getControlsByViewId(1);
     * console.log(controls);
     * // => [{...}, {...}, ...]
     */
    public getControlsByViewId(viewId: number): Control[] | undefined {
        const query = `SELECT * FROM Controls WHERE ViewId = ?`;
        const stmt = this.db.prepare(query);
        const rtn = getAllAsObjects<Control>(stmt, [viewId])

        if (!rtn || !rtn.length) {
            console.warn(`Could not find any controls with viewId ${viewId}`);
            return undefined;
        }

        return rtn;
    }

    /**
     * Get the controls associated with a JoinedId
     * @param joinedId The JoinedId to search for
     * @returns Array of controls
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const controls = p.getControlsByJoinedId(1);
     * console.log(controls);
     * // => [{...}, {...}, ...]
     */
    public getControlsByJoinedId(joinedId: number): Control[] | undefined {
        const query = `SELECT * FROM Controls WHERE JoinedId = ${joinedId}`;
        const stmt = this.db.prepare(query);
        const rtn = getAllAsObjects<Control>(stmt)

        if (!rtn || !rtn.length) {
            console.warn(`Could not find any controls with JoinedId ${joinedId}`);
            return undefined;
        }

        return rtn;
    }


    /**
     * Get the ID of a source group from its name
     * @param name Name of source group
     * @returns SourceGroupId
     * @throws Will throw an error if the source group cannot be found.
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const sourceGroupId = p.getSourceGroupIdFromName('Unused channels');
     * console.log(sourceGroupId);
     * // => 1
     */
    public getSourceGroupIDFromName(name: string): number | undefined {
        const stmt = this.db.prepare('SELECT SourceGroupId from SourceGroups WHERE Name = ?');
        const rtn = stmt.getAsObject([name]) as any as { SourceGroupId: number };
        if (!rtn || rtn.SourceGroupId === undefined) {
            console.warn(`Could not find SourceGroup with name ${name}`);
            return undefined;
        }
        return rtn.SourceGroupId;
    }

    /**
     * Get the currently highest JoinedId
     * @returns Current, highest JoinedId
     * @throws Will throw an error if the a JoinedId cannot be found.
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const nextJoinedId = p.getNextJoinedID();
     * console.log(nextJoinedId);
     * // => 1
     */
    public getHighestJoinedID(): number | undefined {
        const stmt = this.db.prepare('SELECT JoinedId from Controls ORDER BY JoinedId DESC LIMIT 1');

        const rtn = stmt.getAsObject({}) as any as { JoinedId: number }
        if (!rtn || rtn.JoinedId === undefined) {
            console.warn("Views have not been generated. Please run initial setup in R1 first.");
            return undefined;
        }
        return rtn.JoinedId;
    }

    /**
     * Get the highest GroupId
     * @returns Highest GroupId
     * @throws Will throw an error if the highest GroupId cannot be found.
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const highestGroupId = p.getHighestGroupID();
     * console.log(highestGroupId);
     * // => 283
     */
    public getHighestGroupID(): number | undefined {
        const stmt = this.db.prepare('SELECT max(GroupId) FROM Groups');
        // const wow = this.db.exec('SELECT max(GroupId) FROM Groups')
        const rtn = stmt.getAsObject({}) as any as { 'max(GroupId)': number };
        if (!rtn || rtn['max(GroupId)'] === undefined) {
            console.warn("Could not find any groups.");
            return undefined;
        }
        return rtn['max(GroupId)'];
    }

    /**
     * Finds ID of a group from its name
     * @param name Name of group
     * @returns GroupId or undefined
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const groupId = p.getGroupIdFromName('Master');
     * console.log(groupId);
     * // => 2
     */
    public getGroupIdFromName(name: string): number | undefined {
        const stmt = this.db.prepare('SELECT GroupId FROM Groups WHERE Name = ?');
        const rtn = stmt.get([name]) as any as number[];

        if (!rtn || !rtn.length) {
            console.debug(`Could not find group with name ${name}`);
            return undefined;
        }

        return rtn[0];
    }

    /**
     * Finds ID of a view from its name
     * @param name Name of view
     * @returns ViewId or undefined
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const viewId = p.getViewIdFromName('Overview');
     * console.log(viewId);
     * // => 1000
     */
    public getViewIdFromName(name: string): number | undefined {
        const stmt = this.db.prepare('SELECT ViewId FROM Views WHERE Name = ?');
        const rtn = stmt.getAsObject([name]) as { ViewId: number };
        if (!rtn || rtn.ViewId === undefined) {
            console.debug(`Could not find view with name ${name}`);
            return undefined;
        }
        return rtn.ViewId;
    }

    /**
     * Get all views from the Views table
     * @returns Array of views
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const views = p.getAllViews();
     * console.log(views);
     * // => [{ ViewId: 1, Type: 0, Name: 'Overview', Flags: 0, HomeViewIndex: 0, NaviBarIndex: 0, HRes: 1920, VRes: 1080, ZoomLevel: 1 }]
     */
    public getAllRemoteViews() {
        const query = `SELECT * FROM Views WHERE Type = 1000`;
        const stmt = this.db.prepare(query);
        const rtn = getAllAsObjects<View>(stmt);
        if (!rtn || !rtn.length) {
            console.warn(`Could not find any views`);
            return undefined;
        }
        return rtn;
    }

    /**
     * Get all groups from the Groups table
     * @returns Array of groups
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const groups = p.getAllGroups();
     * console.log(groups);
     * // => [{ GroupId: 1, Name: 'Group 1', ParentId: 0, TargetId: 0, TargetChannel: 0, Type: 0, Flags: 0 }]
     */
    public getAllGroups() {
        const query = `SELECT * FROM Groups`;
        const stmt = this.db.prepare(query);

        const rtn = getAllAsObjects<Group>(stmt)
        if (!rtn || !rtn.length) {
            console.warn(`Could not find any groups`);
            return undefined;
        }
        return rtn;
    }

    /**
     * Get all controls from the Controls table
     * @returns Array of controls
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const controls = p.getAllControls();
     * console.log(controls);
     */
    public getAllControls() {
        const query = `SELECT * FROM Controls`;
        const stmt = this.db.prepare(query);
        const rtn = getAllAsObjects<Control>(stmt);
        if (!rtn || !rtn.length) {
            console.warn(`Could not find any controls`);
            return undefined;
        }
        return rtn;
    }

    /**
     * Find the CANid of a device from its DeviceId
     * @returns CANid of device as a string
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const canId = p.getCanIdFromDeviceId(1);
     * console.log(canId); // => '1.01'
     */
    public getCanIdFromDeviceId(deviceId: number): string | undefined {
        const stmt = this.db.prepare('SELECT RemoteIdSubnet, RemoteIdDevice FROM Devices WHERE DeviceId = ?');
        const rtn = stmt.getAsObject([deviceId]) as any as { RemoteIdSubnet: number, RemoteIdDevice: number };
        if (!rtn || rtn.RemoteIdSubnet === undefined || rtn.RemoteIdDevice === undefined) {
            console.warn(`Could not find device with id ${deviceId}`);
            return undefined;
        }
        return `${rtn.RemoteIdSubnet}.${rtn.RemoteIdDevice < 9 ? `0${rtn.RemoteIdDevice}` : rtn.RemoteIdDevice}`;
    }

    /**
     * Insert a control into the Controls table
     * @param control Control to insert
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const control = {
     * ControlId: 1,
     * Type: 1,
     * PosX: 1,
     * PosY: 1,
     * Width: 1,
     * Height: 1,
     * ViewId: 1,
     * DisplayName: 'Test',
     * UniqueName: 'Test',
     * JoinedId: 1,
     * LimitMin: 1,
     * LimitMax: 1,
     * MainColor: 1,
     * SubColor: 1,
     * LabelColor: 1,
     * LabelFont: 1,
     * LabelAlignment: 1,
     * LineThickness: 1,
     * ThresholdValue: 1,
     * Flags: 1,
     * ActionType: 1,
     * TargetType: 1,
     * TargetId: 1,
     * TargetChannel: 1,
     * TargetProperty: 1,
     * TargetRecord: 1,
     * ConfirmOnMsg: 'Test',
     * ConfirmOffMsg: 'Test',
     * PictureIdDay: 1,
     * PictureIdNight: 1,
     * Font: 'Test',
     * Alignment: 1,
     * Dimension: new Uint8Array(1),
     * };
     * p.insertControl(control);
     * console.log(p.getAllControls());
     * // => [{...}, {...}, ...]
     */
    public insertControl(control: Control) {
        const insertControlStmt = this.db.prepare(insertControlQuery);
        insertControlStmt.run([
            control.Type,
            control.PosX,
            control.PosY,
            control.Width,
            control.Height,
            control.ViewId,
            control.DisplayName,
            control.UniqueName,
            control.JoinedId,
            control.LimitMin,
            control.LimitMax,
            control.MainColor,
            control.SubColor,
            control.LabelColor,
            control.LabelFont,
            control.LabelAlignment,
            control.LineThickness,
            control.ThresholdValue,
            control.Flags,
            control.ActionType,
            control.TargetType,
            control.TargetId,
            control.TargetChannel,
            control.TargetProperty,
            control.TargetRecord,
            control.ConfirmOnMsg,
            control.ConfirmOffMsg,
            control.PictureIdDay,
            control.PictureIdNight,
            control.Font,
            control.Alignment,
            control.Dimension || ' '
        ]);
    }
}

/**
 * Row from the Sections table in a template file
 */
export interface Section {
    Id: number;
    Name: string;
    ParentId: number;
    JoinedId: number;
    Description: string;
}


export class TemplateFile extends SqlDbFile {
    constructor(db: SQLjs.Database) {
        super(db);
        const stmt = this.db.prepare(`SELECT * FROM 'main'.'Sections' ORDER BY JoinedId ASC`);
        const templates = stmt.get({}) as any as Section[];
        if (!templates) throw new Error(`Could not find any templates in file.`);
        console.log(`Found ${templates.length} templates in file.`);
    }

    static build = (fb: Buffer) => build<TemplateFile>(fb, (db) => new TemplateFile(db))

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
        const section = this.db.prepare(`SELECT * FROM 'main'.'Sections' WHERE Name = ?`).getAsObject([tempName]) as any as Section;

        if (!section) {
            console.warn(`Template ${tempName} not found.`);
            return undefined;
        }

        const controls = this.db.prepare(`SELECT * FROM Controls WHERE JoinedId = ${section.JoinedId} ORDER BY PosX ASC`).run() as any as Control[];

        return controls;
    }
}
