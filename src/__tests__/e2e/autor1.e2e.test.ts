/* eslint-disable */
/**
 * Tests here operate on project files on disk.
 */
import { AutoR1ProjectFile, AutoR1TemplateFile, FALLBACK_GROUP_TITLE, MAIN_WINDOW_TITLE, METER_SPACING_X, METER_WINDOW_TITLE, MUTE_GROUP_TITLE } from '../../autor1';
import * as fs from 'fs';
import * as dbpr from '../../dbpr'

const PROJECT_NO_INIT_START = './src/__tests__/Projects/test_no_init.dbpr';
const PROJECT_INIT_START = './src/__tests__/Projects/test_init.dbpr';
const PROJECT_INIT_AP_START = './src/__tests__/Projects/test_init_AP.dbpr';
const PROJECT_SUB_ARRAY_START = './src/__tests__/Projects/sub_array.dbpr';
const TEMPLATES_START = './src/__tests__/Projects/templates.r2t';
const PROJECT_INIT = PROJECT_INIT_START + '.test.dbpr';
const PROJECT_INIT_AP = PROJECT_INIT_AP_START + '.test.dbpr';
const PROJECT_NO_INIT = PROJECT_NO_INIT_START + '.test.dbpr';
const PROJECT_SUB_ARRAY = PROJECT_SUB_ARRAY_START + '.test.dbpr';
const TEMPLATES = TEMPLATES_START + '.test.r2t';

// Create a new project file for each test
beforeEach(() => {

    if (fs.existsSync(PROJECT_NO_INIT)) fs.unlinkSync(PROJECT_NO_INIT);
    if (fs.existsSync(PROJECT_INIT)) fs.unlinkSync(PROJECT_INIT);
    if (fs.existsSync(PROJECT_INIT_AP)) fs.unlinkSync(PROJECT_INIT_AP);
    if (fs.existsSync(PROJECT_SUB_ARRAY)) fs.unlinkSync(PROJECT_SUB_ARRAY);
    if (fs.existsSync(TEMPLATES)) fs.unlinkSync(TEMPLATES);

    fs.copyFileSync(PROJECT_NO_INIT_START, PROJECT_NO_INIT);
    fs.copyFileSync(PROJECT_INIT_START, PROJECT_INIT);
    fs.copyFileSync(PROJECT_INIT_AP_START, PROJECT_INIT_AP);
    fs.copyFileSync(PROJECT_SUB_ARRAY_START, PROJECT_SUB_ARRAY);
    fs.copyFileSync(TEMPLATES_START, TEMPLATES);
});

afterEach(() => {
    //fs.unlinkSync(PROJECT_NO_INIT);
    //fs.unlinkSync(PROJECT_INIT);
    //fs.unlinkSync(PROJECT_INIT_AP);
    //fs.unlinkSync(PROJECT_SUB_ARRAY);
    //fs.unlinkSync(TEMPLATES);
});

describe('Mute Group', () => {
    let projectFile: AutoR1ProjectFile;
    let templateFile: AutoR1TemplateFile;

    afterEach(() => {
        projectFile.close();
    })

    beforeEach(() => {
        projectFile = new AutoR1ProjectFile(PROJECT_INIT_AP);
        templateFile = new AutoR1TemplateFile(TEMPLATES);
        const parentId = projectFile.createGroup({ Name: 'Auto R1' });
        projectFile.createSubLRCGroups(parentId);
        projectFile.getSrcGrpInfo();
        projectFile.createMeterView(templateFile);
    });

    it('mute group should only exist after calling method', () => {
        const muteGroup = projectFile.getAllGroups().find((group) => group.Name === MUTE_GROUP_TITLE);

        expect(muteGroup).toBeFalsy();
    })

    it('should create main mute group', () => {
        projectFile.createMainMuteGroup();
        const muteGroup = projectFile.getAllGroups().find((group) => group.Name === MUTE_GROUP_TITLE);

        expect(muteGroup).toBeTruthy();
    })

    it('should skip certain channel groups when creating main mute group', () => {
        projectFile.sourceGroups[0].channelGroups[0].removeFromMute = true;
        projectFile.createMainMuteGroup();
        const muteGroup = projectFile.getAllGroups().find((group) => group.Name === MUTE_GROUP_TITLE);

        const channelsInGroup = projectFile.db.prepare(`SELECT * FROM Groups WHERE ParentId = ${muteGroup?.GroupId}`).all();

        expect(muteGroup).toBeTruthy();
        expect(channelsInGroup.length).toBe(159)
    })

    it('should assign button on the main page to the mute group', () => {
        // Arrange
        // Remove the primary channel group along with the sub group
        // Allows project to be openned in R1 and checked. First meter group should not mute.
        projectFile.sourceGroups[0].channelGroups[0].removeFromMute = true;
        projectFile.sourceGroups[0].channelGroups[1].removeFromMute = true;

        // Act
        projectFile.createMainMuteGroup();
        projectFile.createMainView(templateFile);

        const muteGroup = projectFile.getAllGroups().find((group) => group.Name === MUTE_GROUP_TITLE);

        const muteButton = projectFile.getAllControls().find((control) => control.DisplayName === 'Mute'
            && control.Type === dbpr.ControlTypes.SWITCH
            && control.ViewId === (projectFile as any).getMainView().ViewId
        );

        // Assert
        expect(muteGroup).toBeTruthy();
        expect(muteButton).toBeTruthy();
        expect(muteButton?.TargetId).toBe(muteGroup?.GroupId);
    })
});

describe('Fallback Group', () => {
    let projectFile: AutoR1ProjectFile;
    let templateFile: AutoR1TemplateFile;
    let parentId: number;

    afterEach(() => {
        projectFile.close();
    })

    beforeEach(() => {
        projectFile = new AutoR1ProjectFile(PROJECT_INIT_AP);
        templateFile = new AutoR1TemplateFile(TEMPLATES);
        parentId = projectFile.createGroup({ Name: 'Auto R1' });
        projectFile.createSubLRCGroups(parentId);
        projectFile.getSrcGrpInfo();
        projectFile.createMeterView(templateFile);
    });

    it('fallback group should only exist after calling method', () => {
        const fallbackGroup = projectFile.getAllGroups().find((group) => group.Name === FALLBACK_GROUP_TITLE);

        expect(fallbackGroup).toBeFalsy();
    })

    it('should create main fallback group', () => {
        projectFile.createMainFallbackGroup();
        const fallbackGroup = projectFile.getAllGroups().find((group) => group.Name === FALLBACK_GROUP_TITLE);

        expect(fallbackGroup).toBeTruthy();
    })

    it('should skip certain channel groups when creating main fallback group', () => {
        projectFile.sourceGroups[0].channelGroups[0].removeFromFallback = true;
        projectFile.createMainFallbackGroup();
        const fallbackGroup = projectFile.getAllGroups().find((group) => group.Name === FALLBACK_GROUP_TITLE);

        const channelsInGroup = projectFile.db.prepare(`SELECT * FROM Groups WHERE ParentId = ${fallbackGroup?.GroupId}`).all();

        expect(fallbackGroup).toBeTruthy();
        expect(channelsInGroup.length).toBe(159)
    })

    it('should assign template on the main page to the fallback group', () => {
        // Arrange
        // Remove the primary channel group along with the sub group
        // Allows project to be openned in R1 and checked. First group should not fallover.
        projectFile.sourceGroups[0].channelGroups[0].removeFromFallback = true;
        projectFile.sourceGroups[0].channelGroups[1].removeFromFallback = true;

        // Act
        projectFile.createMainFallbackGroup();
        projectFile.createMainView(templateFile);

        const fallbackGroup = projectFile.getAllGroups().find((group) => group.Name === FALLBACK_GROUP_TITLE);
        const channelsInGroup = projectFile.db.prepare(`SELECT * FROM Groups WHERE ParentId = ${fallbackGroup?.GroupId}`).all();

        const allControls = projectFile.getControlsByViewId((projectFile as any).getMainView().ViewId);

        // Return all unique JoinedIds in ascending order
        const joinedIds = allControls.reduce((prev, cur) => {
            if (prev.includes(cur.JoinedId)) return prev;
            return [...prev, cur.JoinedId];
        }, [] as number[]);

        // Fallback template is the fourth template entered
        const fallbackTemplateJoinedId = joinedIds[3];
        const fallbackTemplate = projectFile.getControlsByJoinedId(fallbackTemplateJoinedId);

        // Assert
        expect(fallbackGroup).toBeTruthy();
        expect(channelsInGroup.length).toBe(143)
        expect(fallbackTemplate.length).toBeTruthy();
        fallbackTemplate.forEach((control) => {
            expect(control.TargetId).toBe(fallbackGroup?.GroupId);
        });
    })

    it('should assign LED on the main page to the fallback group', () => {
        // Act
        projectFile.createMainFallbackGroup();
        projectFile.createMainView(templateFile);

        const fallbackGroup = projectFile.getAllGroups().find((group) => group.Name === FALLBACK_GROUP_TITLE);

        const fallbackButton = projectFile.getAllControls().find((control) => control.DisplayName === 'Fallback is active'
            && control.Type === dbpr.ControlTypes.LED
            && control.ViewId === (projectFile as any).getMainView().ViewId
        );

        // Assert
        expect(fallbackGroup).toBeTruthy();
        expect(fallbackButton).toBeTruthy();
        expect(fallbackButton?.TargetId).toBe(fallbackGroup?.GroupId);
    })

    it('should create the fallback group under the top most R1 group by default', () => {
        // Act
        projectFile.createMainFallbackGroup();

        const fallbackGroup = projectFile.getAllGroups().find((group) => group.Name === FALLBACK_GROUP_TITLE);

        // Assert
        expect(fallbackGroup).toBeTruthy();
        expect(fallbackGroup?.ParentId).toBe(1);
    })

    it('should create the fallback group under the AutoR1 group when specified', () => {
        // Act
        projectFile.createMainFallbackGroup(parentId);

        const fallbackGroup = projectFile.getAllGroups().find((group) => group.Name === FALLBACK_GROUP_TITLE);

        // Assert
        expect(fallbackGroup).toBeTruthy();
        expect(fallbackGroup?.ParentId).toBe(parentId);
    })
});


describe('Views and Controls', () => {
    let projectFile: AutoR1ProjectFile;
    let templateFile: AutoR1TemplateFile;
    let mainViewId: number;
    let meterViewId: number;

    afterAll(() => {
        projectFile.close();
    })

    beforeAll(() => {
        projectFile = new AutoR1ProjectFile(PROJECT_INIT_AP);
        templateFile = new AutoR1TemplateFile(TEMPLATES);

        const parentId = projectFile.createGroup({ Name: 'Auto R1' });
        projectFile.createSubLRCGroups(parentId);
        projectFile.getSrcGrpInfo();
        projectFile.createAPGroup(parentId);
        projectFile.createMeterView(templateFile);
        projectFile.createMainView(templateFile);
        projectFile.createNavButtons(templateFile);
        projectFile.addSubCtoSubL();

        mainViewId = (projectFile as any).getMainView().ViewId;
        meterViewId = (projectFile as any).getMeterView().ViewId;
    });

    describe('Meter Page', () => {
        it('should create the meter page', () => {
            const view = projectFile.db.prepare(`SELECT * FROM Views WHERE ViewId = ${meterViewId}`).all()[0] as dbpr.View;
            expect(view).toBeTruthy();
            expect(view.Name).toBe(METER_WINDOW_TITLE);
        })

        it('should correctly assign TargetType value to digital sync display for groups', () => {
            const digitalSyncControl = projectFile.db.prepare(`SELECT * FROM Controls WHERE ViewId = ${meterViewId} AND TargetProperty = '${dbpr.TargetPropertyType.INPUT_DIGITAL_SYNC}' AND TargetChannel = ${dbpr.TargetChannels.NONE}`).all() as dbpr.Control[];

            digitalSyncControl.forEach((control) => {
                expect(control.TargetType).toBe(dbpr.TargetTypes.GROUP)
                const groupRow = projectFile.db.prepare(`SELECT * FROM Groups WHERE GroupId = ${control.TargetId}`).all() as dbpr.Group[];
                expect(groupRow.length).toBe(1);
                expect(groupRow[0].Type).toBe(dbpr.TargetTypes.GROUP)
            })
        });

        it('should correctly assign TargetChannel value digital sync display for groups', () => {
            const digitalSyncControl = projectFile.db.prepare(`SELECT * FROM Controls WHERE ViewId = ${meterViewId} AND TargetProperty = '${dbpr.TargetPropertyType.INPUT_DIGITAL_SYNC}' AND TargetType = ${dbpr.TargetTypes.GROUP}`).all() as dbpr.Control[];

            digitalSyncControl.forEach((control) => {
                expect(control.TargetChannel).toBe(dbpr.TargetChannels.NONE)
                const groupRow = projectFile.db.prepare(`SELECT * FROM Groups WHERE GroupId = ${control.TargetId}`).all() as dbpr.Group[];
                expect(groupRow.length).toBe(1);
                expect(groupRow[0].Type).toBe(dbpr.TargetTypes.GROUP)
            })
        });

        describe('Digital sync displays', () => {

            it('digital sync displays should not have a TargetChannel set above 0', () => {
                const digitalSyncControl = projectFile.db.prepare(`SELECT * FROM Controls WHERE ViewId = ${meterViewId} AND TargetProperty = 'Input_Digital_Sync'`).all() as dbpr.Control[];
                expect(digitalSyncControl.find(c => c.TargetChannel > 0)).toBeFalsy();
            })

            it('should correctly assign TargetType value to digital sync display for devices', () => {
                const digitalSyncControl = projectFile.db.prepare(`SELECT * FROM Controls WHERE ViewId = ${meterViewId} AND TargetProperty = '${dbpr.TargetPropertyType.INPUT_DIGITAL_SYNC}' AND TargetChannel = ${dbpr.TargetChannels.DEVICE}`).all() as dbpr.Control[];

                digitalSyncControl.forEach((control) => {
                    expect(control.TargetType).toBe(dbpr.TargetTypes.DIRECT_ACCESS)
                    const groupRow = projectFile.db.prepare(`SELECT * FROM Groups WHERE TargetId = ${control.TargetId}`).all() as dbpr.Group[];
                    expect(groupRow.length).toBeGreaterThanOrEqual(1);
                    groupRow.forEach((row) => {
                        expect(row.Type).toBe(dbpr.TargetTypes.CHANNEL)
                    })
                })
            });

            it('should correctly assign TargetChannel value digital sync display for devices', () => {
                const digitalSyncControl = projectFile.db.prepare(`SELECT * FROM Controls WHERE ViewId = ${meterViewId} AND TargetProperty = '${dbpr.TargetPropertyType.INPUT_DIGITAL_SYNC}' AND TargetType = ${dbpr.TargetTypes.DIRECT_ACCESS}`).all() as dbpr.Control[];

                digitalSyncControl.forEach((control) => {
                    expect(control.TargetChannel).toBe(dbpr.TargetChannels.DEVICE)
                    const groupRow = projectFile.db.prepare(`SELECT * FROM Groups WHERE TargetId = ${control.TargetId}`).all() as dbpr.Group[];
                    expect(groupRow.length).toBeGreaterThanOrEqual(1);
                    groupRow.forEach((row) => {
                        expect(row.Type).toBe(dbpr.TargetTypes.CHANNEL);
                    })
                })
            });

        });

        it('should generate GR indicators properly', () => {
            const ovlIndicators = projectFile.db.prepare(`SELECT * FROM Controls WHERE ViewId = ${meterViewId} AND Type = ${dbpr.ControlTypes.LED} and TargetProperty = '${dbpr.TargetPropertyType.CHANNEL_STATUS_REM_HOLD_GR}'`).all() as dbpr.Control[];
            expect(ovlIndicators.length).toBeTruthy();
            ovlIndicators.forEach(control => {
                expect(control.TargetType).toBe(dbpr.TargetTypes.DIRECT_ACCESS);
                expect(control.TargetId).toBeTruthy();
                expect(control.TargetChannel).toBeGreaterThan(0);
            });
        });

        it('should generate OVL indicators properly', () => {
            const ovlIndicators = projectFile.db.prepare(`SELECT * FROM Controls WHERE ViewId = ${meterViewId} AND Type = ${dbpr.ControlTypes.LED} and TargetProperty = '${dbpr.TargetPropertyType.CHANNEL_STATUS_REM_HOLD_OVL}'`).all() as dbpr.Control[];
            ovlIndicators.forEach(control => {
                expect(control.TargetType).toBe(dbpr.TargetTypes.DIRECT_ACCESS);
                expect(control.TargetId).toBeTruthy();
                expect(control.TargetChannel).toBeGreaterThan(0);
            });
        });
    });

    describe('Main Page', () => {
        it('should create the main page', () => {
            const view = projectFile.db.prepare(`SELECT * FROM Views WHERE ViewId = ${mainViewId}`).all()[0] as dbpr.View;
            expect(view).toBeTruthy();
            expect(view.Name).toBe(MAIN_WINDOW_TITLE);
        })

        /**
         * Addresses bug where meter were disappearing due to objects being passed as references
         */
        it('should correctly position meters', () => {
            const controls = projectFile.getControlsByViewId(mainViewId).filter(control =>
                control.Type === dbpr.ControlTypes.FRAME
                && Math.round(control.PosX) >= 483
                && Math.round(control.PosY) == 110
            );

            const { width: meterTempWidth, height: meterTempHeight } = templateFile.getTemplateWidthHeight('Group LR AP CPL2');

            controls.forEach((control, index) => {
                expect(Math.round(control.PosX)).toBe(483 + (index * METER_SPACING_X) + (index * meterTempWidth))
            });
        });

        it('should correctly assign controls for main group', () => {
            const rtn = projectFile.db.prepare(`SELECT * FROM Controls WHERE ViewId = ${mainViewId} AND DisplayName = 'Power' AND Type = ${dbpr.ControlTypes.SWITCH}`).all() as dbpr.Control[];
            expect(rtn.length).toBe(1)
            const mainViewPowerButton = rtn[0];
            const mainGroupId = projectFile.getMasterGroupID();
            expect(mainViewPowerButton.TargetType).toBe(dbpr.TargetTypes.GROUP);
            expect(mainViewPowerButton.TargetChannel).toBe(dbpr.TargetChannels.NONE); // No target channel configured as it is targeting a group
            expect(mainViewPowerButton.TargetId).toBe(mainGroupId);
            expect(mainViewPowerButton.TargetProperty).toBe(dbpr.TargetPropertyType.SETTINGS_POWER_ON);
        });

        it('should not insert View EQ switch for an additional amp device', () => {
            const viewEqSwitches = projectFile.db.prepare(`SELECT * FROM Controls WHERE ViewId = ${mainViewId} AND DisplayName = 'View EQ' AND Type = ${dbpr.ControlTypes.SWITCH}`).all() as dbpr.Control[];
            // const nonAdditionalDeviceSources = projectFile.db.prepare(`SELECT * FROM Views WHERE Name LIKE '%EQ%'`).all();
            expect(viewEqSwitches.length).toBe(14)
            //TODO: Sub controls on main page are not created for mixed sub/top arrays so the above value cannot be calculated properly currently
        })

        it('should insert controls from each template under the same JoinedId', () => {
            // Fetch a control that is present in all meter templates and expect IDs to increment by 1 each time
            const viewEqSwitches = projectFile.db.prepare(`SELECT * FROM Controls WHERE ViewId = ${mainViewId} AND DisplayName = 'View EQ' AND Type = ${dbpr.ControlTypes.SWITCH}`).all() as dbpr.Control[];
            viewEqSwitches.reduce((prevCplSwitch, curCplSwitch) => {
                if (prevCplSwitch) {
                    expect(curCplSwitch.JoinedId).toBeGreaterThanOrEqual(prevCplSwitch.JoinedId + 1);
                    expect(curCplSwitch.JoinedId).toBeLessThanOrEqual(prevCplSwitch.JoinedId + 2);
                }
                return curCplSwitch;
            });
        });

        it('should not insert load match enable switch for an additional amp device', () => {
            const group1Switch = projectFile.db.prepare(`SELECT * FROM Controls WHERE ViewId = ${mainViewId} AND DisplayName = 'Group 1' AND Type = ${dbpr.ControlTypes.SWITCH}`).get() as dbpr.Control;
            const group1MainControls = projectFile.db.prepare(`SELECT * FROM Controls WHERE JoinedId = ${group1Switch.JoinedId}`).all() as dbpr.Control[];
            expect(group1MainControls.find((control) => control.TargetProperty === dbpr.TargetPropertyType.CONFIG_LOAD_MATCH_ENABLE)).toBeFalsy();
        });

        it('should set the font correctly for text boxes', () => {
            const projectTitle = projectFile.db.prepare(`SELECT * FROM Controls WHERE ViewId = ${mainViewId} AND DisplayName = ? and Type = ?`).get('Auto - Main', dbpr.ControlTypes.TEXT) as dbpr.Control;
            const templateTitle = templateFile.db.prepare(`SELECT * FROM Controls WHERE DisplayName = ? and Type = ?`).get('Auto - Main', dbpr.ControlTypes.TEXT) as dbpr.Control;

            expect(projectTitle.Font).toBe(templateTitle.Font);
        })

        /**
         * Addresses bug where relative delay controls were not being set correctly
         */
        it('should correctly set relative delay controls', () => {
            const overviewView = projectFile.getAllViews().find(view => view.Name === 'Overview')

            const regularRelDelayControls = projectFile.db.prepare(`
            SELECT * FROM Controls WHERE ViewId != ${mainViewId} AND ViewId != ${overviewView?.ViewId} AND DisplayName = ? AND TargetProperty = ?`).all('rel. Delay', dbpr.TargetPropertyDigitalChannel.CHANNEL_STATUS_MS_DELAY) as dbpr.Control[];

            const mainViewRelDelayControls = projectFile.db.prepare(`SELECT * FROM Controls WHERE ViewId = ${mainViewId} AND TargetProperty = ? AND Flags = ?`).all(dbpr.TargetPropertyDigitalChannel.CHANNEL_STATUS_MS_DELAY, dbpr.ControlFlags.RELATIVE) as dbpr.Control[];

            expect(mainViewRelDelayControls.length).toBe(regularRelDelayControls.length)
        })

        /**
     * Addresses bug where mute controls were either not assigned, assigned to the same channel within a pair of controls or, were assigned to a parent or child of the neighbouring mute control
     */
        it('should correctly assign TargetId for mute controls', () => {
            const muteControls = projectFile.getControlsByViewId(mainViewId).filter(control => (
                control.Type === dbpr.ControlTypes.SWITCH
                && control.TargetProperty === dbpr.TargetPropertyType.CONFIG_MUTE
                && Math.round(control.PosY) === 446
            ));

            expect(muteControls.length).toBeTruthy();

            const allGroups = projectFile.getAllGroups();

            const discoveredMuteChannelTargetIDs: number[] = []
            muteControls.forEach(control => {
                expect(control.TargetId).toBeGreaterThan(1);
                expect(discoveredMuteChannelTargetIDs.includes(control.TargetId)).toBeFalsy();

                // Check that the neighbouring mute control is not a parent or child of the current mute control
                if (discoveredMuteChannelTargetIDs.length) {
                    const thisGroup = allGroups.find((group) => group.GroupId === control.TargetId);
                    const lastGroupId = discoveredMuteChannelTargetIDs[discoveredMuteChannelTargetIDs.length - 1];

                    expect(thisGroup).toBeTruthy();
                    expect(thisGroup!.ParentId).not.toEqual(lastGroupId)

                    if (discoveredMuteChannelTargetIDs.length > 1) {

                        const lastGroup = allGroups.find((group) => group.GroupId === lastGroupId);

                        expect(lastGroupId).toBeTruthy();

                        expect(lastGroup!.ParentId).not.toEqual(control.TargetId)
                    }
                }

                discoveredMuteChannelTargetIDs.push(control.TargetId);
            });
        });

        it('should correctly assign TargetId for meter controls', () => {
            const meterControls = projectFile.getControlsByViewId(mainViewId).filter(control => (
                control.Type === dbpr.ControlTypes.METER
                && control.TargetProperty === dbpr.TargetPropertyType.CHANNEL_STATUS_GAIN_REDUCTION_HEADROOM
                && Math.round(control.PosY) === 149
            ));

            expect(meterControls.length).toBeTruthy();

            const discoveredMeterChannelTargetIDs: {
                TargetId: number, TargetChannel: number
            }[] = []
            meterControls.forEach(control => {
                expect(control.TargetId).toBeGreaterThan(0);
                expect(control.TargetChannel).toBeGreaterThan(0);
                expect(discoveredMeterChannelTargetIDs.includes({
                    TargetId: control.TargetId, TargetChannel: control.TargetChannel
                })).toBeFalsy();


                discoveredMeterChannelTargetIDs.push({
                    TargetId: control.TargetId, TargetChannel: control.TargetChannel
                });
            });
        });

        // TODO: Cannot be run simultaneously with all other tests for an unknown reason
        it('should correctly skip CPL controls for sources which it is not available for', () => {
            const overviewView = projectFile.getAllViews().find(view => view.Name === 'Overview')
            const regularCplSwitches = projectFile.db.prepare(`SELECT * FROM Controls WHERE ViewId != ${mainViewId} AND ViewId != ${overviewView?.ViewId} AND DisplayName = 'CPL' AND Type = ${dbpr.ControlTypes.DIGITAL}`).all() as dbpr.Control[];

            const mainViewCplSwitches = projectFile.db.prepare(`SELECT * FROM Controls WHERE ViewId = ${mainViewId} AND DisplayName = 'CPL' AND Type = ${dbpr.ControlTypes.DIGITAL}`).all() as dbpr.Control[];
            expect(mainViewCplSwitches.length).toBe(regularCplSwitches.length)
            mainViewCplSwitches.forEach(cplSwitch => {
                expect(cplSwitch.TargetType).toBe(dbpr.TargetTypes.GROUP);
                expect(cplSwitch.TargetChannel).toBe(dbpr.TargetChannels.NONE);
                expect(cplSwitch.TargetId).toBeTruthy();
                expect(cplSwitch.TargetProperty).toBe(dbpr.TargetPropertyType.CONFIG_FILTER3);
            });
        });
    })
});

describe('Project with only sub array', () => {
    let projectFile: AutoR1ProjectFile;
    let templateFile: AutoR1TemplateFile;
    let mainViewId: number;
    let meterViewId: number;
    const CPL_SOURCE_COUNT = 0;
    const VIEW_EQ_SWITCH_COUNT = 1;

    beforeEach(() => {
        projectFile = new AutoR1ProjectFile(PROJECT_SUB_ARRAY);
        templateFile = new AutoR1TemplateFile(TEMPLATES);

        const parentId = projectFile.createGroup({ Name: 'Auto R1' });
        projectFile.createSubLRCGroups(parentId);
        projectFile.getSrcGrpInfo();
        try {
            projectFile.createAPGroup();
        } catch { }
        projectFile.createMeterView(templateFile);
        projectFile.createMainView(templateFile);
        projectFile.createNavButtons(templateFile);
        try {
            projectFile.addSubCtoSubL();
        } catch {

        }

        mainViewId = (projectFile as any).getMainView().ViewId;
        meterViewId = (projectFile as any).getMeterView().ViewId;
    });

    it('should create the main page', () => {
        const view = projectFile.db.prepare(`SELECT * FROM Views WHERE ViewId = ${mainViewId}`).all()[0] as dbpr.View;
        expect(view).toBeTruthy();
        expect(view.Name).toBe(MAIN_WINDOW_TITLE);
    })

    it('should create the meter page', () => {
        const view = projectFile.db.prepare(`SELECT * FROM Views WHERE ViewId = ${meterViewId}`).all()[0] as dbpr.View;
        expect(view).toBeTruthy();
        expect(view.Name).toBe(METER_WINDOW_TITLE);
    })

    it('should correctly assign controls for main group', () => {
        const rtn = projectFile.db.prepare(`SELECT * FROM Controls WHERE ViewId = ${mainViewId} AND DisplayName = 'Power' AND Type = ${dbpr.ControlTypes.SWITCH}`).all() as dbpr.Control[];
        expect(rtn.length).toBe(1)
        const mainViewPowerButton = rtn[0];
        const mainGroupId = projectFile.getMasterGroupID();
        expect(mainViewPowerButton.TargetType).toBe(dbpr.TargetTypes.GROUP);
        expect(mainViewPowerButton.TargetChannel).toBe(dbpr.TargetChannels.NONE); // No target channel configured as it is targeting a group
        expect(mainViewPowerButton.TargetId).toBe(mainGroupId);
        expect(mainViewPowerButton.TargetProperty).toBe(dbpr.TargetPropertyType.SETTINGS_POWER_ON);
    });

    it('should correctly skip CPL controls for sources which it is not available for', () => {

        const cplSwitches = projectFile.db.prepare(`SELECT * FROM Controls WHERE ViewId = ${mainViewId} AND DisplayName = 'CPL' AND Type = ${dbpr.ControlTypes.DIGITAL}`).all() as dbpr.Control[];
        expect(cplSwitches.length).toBe(CPL_SOURCE_COUNT)
        cplSwitches.forEach(cplSwitch => {
            expect(cplSwitch.TargetType).toBe(dbpr.TargetTypes.GROUP);
            expect(cplSwitch.TargetChannel).not.toBe(dbpr.TargetChannels.NONE);
            expect(cplSwitch.TargetId).toBeTruthy();
            expect(cplSwitch.TargetProperty).toBe(dbpr.TargetPropertyType.CONFIG_FILTER3);
        });
    });

    it('should insert controls from each template under the same JoinedId', () => {
        // Fetch a control that is present in all meter templates and expect IDs to increment by 1 each time
        const viewEqSwitches = projectFile.db.prepare(`SELECT * FROM Controls WHERE ViewId = ${mainViewId} AND DisplayName = 'View EQ' AND Type = ${dbpr.ControlTypes.SWITCH}`).all() as dbpr.Control[];
        viewEqSwitches.reduce((prevCplSwitch, curCplSwitch) => {
            if (prevCplSwitch) {
                expect(curCplSwitch.JoinedId).toBe(prevCplSwitch.JoinedId + 1);
            }
            return curCplSwitch;
        });
    });

    it('should not insert View EQ switch for an additional amp device', () => {
        const viewEqSwitches = projectFile.db.prepare(`SELECT * FROM Controls WHERE ViewId = ${mainViewId} AND DisplayName = 'View EQ' AND Type = ${dbpr.ControlTypes.SWITCH}`).all() as dbpr.Control[];
        // const nonAdditionalDeviceSources = projectFile.db.prepare(`SELECT * FROM Views WHERE Name LIKE '%EQ%'`).all();
        expect(viewEqSwitches.length).toBe(VIEW_EQ_SWITCH_COUNT)
        //TODO: Sub controls on main page are not created for mixed sub/top arrays so the above value cannot be calculated properly currently
    })

    it('should set the font correctly for text boxes', () => {
        const projectTitle = projectFile.db.prepare(`SELECT * FROM Controls WHERE ViewId = ${mainViewId} AND DisplayName = ? and Type = ?`).get('Auto - Main', dbpr.ControlTypes.TEXT) as dbpr.Control;
        const templateTitle = templateFile.db.prepare(`SELECT * FROM Controls WHERE DisplayName = ? and Type = ?`).get('Auto - Main', dbpr.ControlTypes.TEXT) as dbpr.Control;

        expect(projectTitle.Font).toBe(templateTitle.Font);
    });
});