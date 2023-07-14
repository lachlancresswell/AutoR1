import { existsSync } from 'fs';
import * as Database from 'better-sqlite3';
export const ARRAYCALC_SNAPSHOT = 1;  // Snapshot ID
export const INPUT_TYPES = ["A1", "A2", "A3", "A4", "D1", "D2", "D3", "D4"];

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

export enum TargetPropertyType {
    ARRAYPROCESSING_COMMENT = "ArrayProcessing_Comment",
    ARRAYPROCESSING_ENABLE = "ArrayProcessing_Enable",
    CHANNEL_STATUS_AMP_TEMPERATURE = "ChStatus_AmpTemperature",
    CHANNEL_STATUS_GAIN_REDUCTION_HEADROOM = "ChStatus_GrHead",
    CHANNEL_STATUS_MS_DELAY = "ChStatus_MsDelay",
    CHANNEL_STATUS_SPEAKER_IMPEDANCE = "ChStatus_SpeakerImpedance",
    CHANNEL_STATUS_OVL = "ChStatus_RemHold_Ovl",
    CHANNEL_STATUS_GAIN_REDUCTION = "ChStatus_RemHold_GR",
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
    ERROR_GNRL_ERR = "Error_GnrlErr",
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
    SETTINGS_PWR_ON = "Settings_PwrOn",
    STATUS_HUMIDITY = "Status_Humidity",
    STATUS_INPUT_FALLBACK_ACTIVE = "Status_InputFallbackActive",
    STATUS_TEMPERATURE = "Status_Temperature",
    STATUS_SMPS_FREQUENCY = "Status_SmpsFrequency",
    STATUS_MAINS_POWER_PEAK = "Status_MainsPowerPeak",
    STATUS_SMPS_VOLTAGE = "Status_SmpsVoltage",
    STATUS_SMPS_TEMPERATURE = "Status_SmpsTemperature",
    STATUS_LOCK_MODE = "Status_LockMode",
    STATUS_STATUS_TEXT = "Status_StatusText",
    STATUS_PWR_OK = "Status_PwrOk",
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
    ActionType: number;
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
    Dimension: Uint8Array;
}

enum ViewTypes {
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

export class SqlDbFile {
    private f: string;
    public db: Database.Database;

    /**
     * Load existing SQL database file
     * @param path - Path to database file
     * @throws Will throw an error if the file does not exist.
     */
    constructor(path: string) {
        if (!existsSync(path)) {
            throw new Error("File does not exist.");
        }

        this.f = path;
        this.db = new Database(this.f);
    }

    /**
     * Close the database connection. This can fail on Windows in some cases.
     */
    public close(): void {
        try {
            this.db.pragma('journal_mode = DELETE');
        } catch (err) {
            // Ignored
        }

        this.db.close();
    }
}

export class ProjectFile extends SqlDbFile {
    constructor(f: string) {
        super(f);  // Inherit from parent class
        try {
            this.getMasterGroupID();
        } catch (err) {
            throw (new Error("Project file is not initialised"));
        }
    }

    /**
     * Recursively delete a group and all its children
     * @param groupID GroupId
     * @throws Will throw an error if the group cannot be found.
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * p.deleteGroup(1);
     */
    public deleteGroup(groupID: number): void {
        // Remove all children first
        const childrenStmt = this.db.prepare('SELECT GroupId FROM Groups WHERE ParentId = ?');
        const children = childrenStmt.all(groupID) as { GroupId: number }[];

        if (!children) {
            throw new Error(`Could not find any groups with ParentID ${groupID}`);
        }

        for (const child of children) {
            this.deleteGroup((child).GroupId);
        }

        // Delete group
        const deleteStmt = this.db.prepare('DELETE FROM Groups WHERE GroupId = ?');
        deleteStmt.run(groupID);
    }

    /**
     * Get the ID of the master group
     * @returns GroupId of master group
     * @throws Will throw an error if the master group cannot be found.
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const masterId = p.getMasterID();
     * console.log(masterId);
     * // => 1
     */
    public getMasterGroupID(): number {
        const stmt = this.db.prepare("SELECT GroupId FROM Groups WHERE ParentId = 1 AND Name = 'Master'");
        const rtn = stmt.get() as { GroupId: number };
        if (!rtn) {
            throw new Error('Cannot find Master group');
        }
        return rtn.GroupId;
    }

    /**
     * Get the name of a source group from its ID
     * @param id SourceGroupId
     * @returns Name of source group
     * @throws Will throw an error if the source group cannot be found.
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const sourceGroupName = p.getSourceGroupNameFromId(1);
     * console.log(sourceGroupName);
     * // => 'Unused channels'
     */
    public getSourceGroupNameFromID(id: number): string {
        const stmt = this.db.prepare('SELECT Name from SourceGroups WHERE SourceGroupId = ?');
        const rtn = stmt.get(id) as { Name: string };
        if (!rtn) {
            throw new Error(`Could not find SourceGroup with id ${id}`);
        }
        return rtn.Name;
    }

    /**
     * Get the controls from a view from the view ID
     * @param viewId ViewId
     * @returns Array of controls
     * @throws Will throw an error if the controls cannot be found.
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const controls = p.getControlsByViewId(1);
     * console.log(controls);
     * // => [{...}, {...}, ...]
     */
    public getControlsByViewId(viewId: number): Control[] {
        const query = `SELECT * FROM Controls WHERE ViewId = ${viewId}`;
        const stmt = this.db.prepare(query);
        const rtn = stmt.all() as Control[];

        if (!rtn || !rtn.length) {
            throw new Error(`Could not find any controls with viewId ${viewId}`);
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
    public getSourceGroupIDFromName(name: string): number {
        const stmt = this.db.prepare('SELECT SourceGroupId from SourceGroups WHERE Name = ?');
        const rtn = stmt.get(name) as { SourceGroupId: number };
        if (!rtn) {
            throw new Error(`Could not find SourceGroup with name ${name}`);
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
    public getHighestJoinedID(): number {
        const stmt = this.db.prepare('SELECT JoinedId from Controls ORDER BY JoinedId DESC LIMIT 1');
        const rtn = stmt.get() as { JoinedId: number };
        if (!rtn) {
            throw new Error("Views have not been generated. Please run initial setup in R1 first.");
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
    public getHighestGroupID(): number {
        const stmt = this.db.prepare('SELECT max(GroupId) FROM Groups');
        const rtn = stmt.get() as { 'max(GroupId)': number };
        if (!rtn) {
            throw new Error("Could not find any groups.");
        }
        return rtn['max(GroupId)'];
    }

    /**
     * Finds ID of a group from its name
     * @param name Name of group
     * @returns GroupId
     * @throws Will throw an error if the group cannot be found.
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const groupId = p.getGroupIdFromName('Master');
     * console.log(groupId);
     * // => 2
     */
    public getGroupIdFromName(name: string): number {
        const stmt = this.db.prepare('SELECT GroupId FROM Groups WHERE Name = ?');
        const rtn = stmt.get(name) as { GroupId: number }
        if (!rtn) {
            throw new Error(`Could not find group with name ${name}`);
        }
        return rtn.GroupId
    }

    /**
     * Finds ID of a view from its name
     * @param name Name of view
     * @returns ViewId
     * @throws Will throw an error if the view cannot be found.
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const viewId = p.getViewIdFromName('Overview');
     * console.log(viewId);
     * // => 1000
     */
    public getViewIdFromName(name: string): number {
        const stmt = this.db.prepare('SELECT ViewId FROM Views WHERE Name = ?');
        const rtn = stmt.get(name) as { ViewId: number };
        if (!rtn) {
            throw new Error(`Could not find view with name ${name}`);
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
    public getAllViews() {
        const query = `SELECT * FROM Views`;
        const stmt = this.db.prepare(query);
        const rtn = stmt.all() as View[];
        if (!rtn) {
            throw new Error(`Could not find any views`);
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
        const rtn = stmt.all() as Group[];
        if (!rtn) {
            throw new Error(`Could not find any groups`);
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
        const rtn = stmt.all() as Control[];
        if (!rtn) {
            throw new Error(`Could not find any controls`);
        }
        return rtn;
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
    constructor(f: string) {
        super(f);

        try {
            const templates = this.db.prepare(`SELECT * FROM 'main'.'Sections' ORDER BY JoinedId ASC`).all() as Section[];
            console.log(`Found ${templates.length} templates in file.`);
        } catch (error) {
            throw new Error(`Could not find any templates in file.`);
        }
    }

    getTemplateControlsByName(tempName: string): Control[] {
        const section = this.db.prepare(`SELECT * FROM 'main'.'Sections' WHERE Name = ?`).get(tempName) as Section[];

        if (!section) {
            throw new Error(`Template ${tempName} not found.`);
        }

        const controls = this.db.prepare(`SELECT * FROM Controls WHERE JoinedId = ${section[0].JoinedId} ORDER BY PosX ASC`).all() as Control[];

        return controls;
    }
}
