import { AutoR1ProjectFile, AutoR1TemplateFile, MASTER_WINDOW_TITLE, createMasterView, createMeterView } from '../../autor1';
import * as fs from 'fs';
import * as dbpr from '../../dbpr'

const PROJECT_NO_INIT_START = './src/__tests__/Projects/test_no_init.dbpr';
const PROJECT_INIT_START = './src/__tests__/Projects/test_init.dbpr';
const PROJECT_INIT_AP_START = './src/__tests__/Projects/test_init_AP.dbpr';
const TEMPLATES_START = './src/__tests__/Projects/templates.r2t';
const PROJECT_INIT = PROJECT_INIT_START + '.test.dbpr';
const PROJECT_INIT_AP = PROJECT_INIT_AP_START + '.test.dbpr';
const PROJECT_NO_INIT = PROJECT_NO_INIT_START + '.test.dbpr';
const TEMPLATES = TEMPLATES_START + '.test.r2t';

// Create a new project file for each test
beforeEach(() => {

    if (fs.existsSync(PROJECT_NO_INIT)) fs.unlinkSync(PROJECT_NO_INIT);
    if (fs.existsSync(PROJECT_INIT)) fs.unlinkSync(PROJECT_INIT);
    if (fs.existsSync(PROJECT_INIT_AP)) fs.unlinkSync(PROJECT_INIT_AP);
    if (fs.existsSync(TEMPLATES)) fs.unlinkSync(TEMPLATES);

    fs.copyFileSync(PROJECT_NO_INIT_START, PROJECT_NO_INIT);
    fs.copyFileSync(PROJECT_INIT_START, PROJECT_INIT);
    fs.copyFileSync(PROJECT_INIT_AP_START, PROJECT_INIT_AP);
    fs.copyFileSync(TEMPLATES_START, TEMPLATES);
});

afterEach(() => {
    fs.unlinkSync(PROJECT_NO_INIT);
    fs.unlinkSync(PROJECT_INIT);
    fs.unlinkSync(PROJECT_INIT_AP);
    fs.unlinkSync(TEMPLATES);
});


describe('App', () => {
    let projectFile: AutoR1ProjectFile;
    let templateFile: AutoR1TemplateFile;

    beforeEach(() => {
        projectFile = new AutoR1ProjectFile(PROJECT_INIT_AP);
        templateFile = new AutoR1TemplateFile(TEMPLATES);

        const parentId = projectFile.createGrp('Auto R1');
        projectFile.createSubLRCGroups(parentId);
        projectFile.getSrcGrpInfo();
        projectFile.configureApChannels();
        createMeterView(projectFile, templateFile);
        createMasterView(projectFile, templateFile);
        projectFile.createNavButtons(templateFile);
        projectFile.addSubCtoSubL();
    });

    it('should correctly assign controls for master group', () => {
        const rtn = projectFile.db.prepare(`SELECT * FROM Controls WHERE ViewId = 1049 AND DisplayName = 'Power' AND Type = ${dbpr.ControlTypes.SWITCH}`).all() as dbpr.Control[];
        expect(rtn.length).toBe(1)
        const masterViewPowerButton = rtn[0];
        const masterGroupId = projectFile.getMasterGroupID();
        expect(masterViewPowerButton.TargetType).toBe(dbpr.TargetTypes.GROUP);
        expect(masterViewPowerButton.TargetChannel).toBe(dbpr.TargetChannels.NONE); // No target channel configured as it is targeting a group
        expect(masterViewPowerButton.TargetId).toBe(masterGroupId);
        expect(masterViewPowerButton.TargetProperty).toBe(dbpr.TargetPropertyType.SETTINGS_PWR_ON);
    });

    it('should correctly skip CPL controls for sources which it is not available for', () => {

        const cplSwitches = projectFile.db.prepare(`SELECT * FROM Controls WHERE ViewId = 1049 AND DisplayName = 'CPL' AND Type = ${dbpr.ControlTypes.DIGITAL}`).all() as dbpr.Control[];
        expect(cplSwitches.length).toBe(6)
        cplSwitches.forEach(cplSwitch => {
            expect(cplSwitch.TargetType).toBe(dbpr.TargetTypes.GROUP);
            expect(cplSwitch.TargetChannel).not.toBe(dbpr.TargetChannels.NONE);
            expect(cplSwitch.TargetId).toBeTruthy();
            expect(cplSwitch.TargetProperty).toBe(dbpr.TargetPropertyType.CONFIG_FILTER3);
        });
    });

    it('should insert controls from each template under the same JoinedId', () => {
        // Fetch a control that is present in all meter templates and expect IDs to increment by 1 each time
        const viewEqSwitches = projectFile.db.prepare(`SELECT * FROM Controls WHERE ViewId = 1049 AND DisplayName = 'View EQ' AND Type = ${dbpr.ControlTypes.SWITCH}`).all() as dbpr.Control[];
        viewEqSwitches.reduce((prevCplSwitch, curCplSwitch) => {
            if (prevCplSwitch) {
                expect(curCplSwitch.JoinedId).toBe(prevCplSwitch.JoinedId + 1);
            }
            return curCplSwitch;
        });
    });

    it('should not insert View EQ switch for an additional amp device', () => {
        const viewEqSwitches = projectFile.db.prepare(`SELECT * FROM Controls WHERE ViewId = 1049 AND DisplayName = 'View EQ' AND Type = ${dbpr.ControlTypes.SWITCH}`).all() as dbpr.Control[];
        // const nonAdditionalDeviceSources = projectFile.db.prepare(`SELECT * FROM Views WHERE Name LIKE '%EQ%'`).all();
        expect(viewEqSwitches.length).toBe(13)
        //TODO: Sub controls on master page are not created for mixed sub/top arrays so the above value cannot be calculated properly currently
    })

    it('should not insert load match enable switch for an additional amp device', () => {
        const group1Switch = projectFile.db.prepare(`SELECT * FROM Controls WHERE ViewId = 1049 AND DisplayName = 'Group 1' AND Type = ${dbpr.ControlTypes.SWITCH}`).get() as dbpr.Control;
        const group1MasterControls = projectFile.db.prepare(`SELECT * FROM Controls WHERE JoinedId = ${group1Switch.JoinedId}`).all() as dbpr.Control[];
        expect(group1MasterControls.find((control) => control.TargetProperty === dbpr.TargetPropertyType.CONFIG_LOAD_MATCH_ENABLE)).toBeFalsy();
    });

    it('should set the font correctly for text boxes', () => {
        const projectTitle = projectFile.db.prepare(`SELECT * FROM Controls WHERE ViewId = 1049 AND DisplayName = ? and Type = ?`).get('Auto - Master', dbpr.ControlTypes.TEXT) as dbpr.Control;
        const templateTitle = templateFile.db.prepare(`SELECT * FROM Controls WHERE DisplayName = ? and Type = ?`).get('Auto - Master', dbpr.ControlTypes.TEXT) as dbpr.Control;

        expect(projectTitle.Font).toBe(templateTitle.Font);
    })
});