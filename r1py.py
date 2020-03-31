import sqlite3
import logging
import sys
from abc import ABCMeta, abstractmethod

PARENT_GROUP_TITLE = 'AUTO'
AP_GROUP_TITLE = 'AP'
METER_WINDOW_TITLE = "AUTO - Meters"
MASTER_WINDOW_TITLE = 'AUTO - Master'
INPUT_SNAP_NAME = "IP Config"

TYPE_SUBS_C = 7
TYPE_SUBS_R = 6
TYPE_SUBS_L = 5
TYPE_SUBS = 4
TYPE_TOPS_L = 3
TYPE_TOPS_R = 2
TYPE_TOPS = 1
TYPE_POINT = 0
CTRL_FRAME = 12
CTRL_METER = 7
CTRL_BUTTON = 4
CTRL_INPUT = 3

IPCONFIG_DEFAULT = [0,0,0,0,0,0,0,0]

ARRAYCALC_SNAPSHOT = 1 #Snapshot ID
INPUT_TYPES = ["A1", "A2", "A3", "A4", "D1", "D2", "D3", "D4"]
ipStr = ["Config_InputEnable1", "Config_InputEnable2", "Config_InputEnable3", "Config_InputEnable4", "Config_InputEnable5", "Config_InputEnable6", "Config_InputEnable7", "Config_InputEnable8"]
TARGET_ID = 3

NAV_BUTTON_X = 230
NAV_BUTTON_Y = 15

METER_VIEW_STARTX = 15
METER_VIEW_STARTY = 15
METER_SPACING_X = 15
METER_SPACING_Y = 15

DEV_PROP_TYPES = [
'Status_SmpsFrequency'
,'Status_MainsPowerPeak'
,'Status_SmpsVoltage'
,'Status_SmpsTemperature'
,'Status_LockMode'
,'Status_StatusText'
,'Status_PwrOk'
,'Settings_Buzzer'
,'Settings_DeviceName'
,'Settings_InputGainEnable'
,'Settings_LockCmd'
,'Settings_MCLEnable'
,'Settings_PwrOn'
,'Input_Analog_Gain'
,'Input_Digital_Gain'
,'Input_Digital_Mode'
,'Input_Digital_Sync'
,'Input_Digital_SampleStatus'
,'Input_Digital_DsDataPri'
,'Input_Digital_DsDataSec'
,'Input_Digital_TxStream'
,'Error_GnrlErr'
,'Error_SmpsTempOff'
,'Error_SmpsTempWarn']


##### An R1 SQL File (.dbpr project file or .r1t template file) #####
class R1db(object):
    __metaclass__ = ABCMeta
    def __init__(self, f):
        self.f = f
        self.db = sqlite3.connect(f);
        self.cursor = self.db.cursor();
        logging.info('Loaded file - ' + f)

    def close(self):
        self.db.commit()
        self.db.close()


##### Source groups are created in ArrayCalc ########
class SourceGroup:
    def __init__(self, row):
        self.viewId = row[0]
        self.name = row[1]
        self.srcId = row[2]
        self.nextSrcId = row[3]
        self.type = row[4]*10 if self.nextSrcId <= 0 else 40 # Group is stereo if nextSrcId exists
        self.apEnable = row[5] if row[5] else 0;
        self.asId = row[6]
        self.cabFamily = row[7]
        self.groupId = row[8]
        self.groupName = row[9]
        self.topGroupId = row[10]
        self.topGroupName = row[11]
        self.topLeftGroupId = row[12]
        self.topLeftGroupName = row[13]
        self.topRightGroupId = row[14]
        self.topRightGroupName = row[15]
        self.subGroupId = row[16]
        self.subGroupName = row[17]
        self.subLeftGroupId = row[18]
        self.subLeftGroupName = row[19]
        self.subRightGroupId = row[20]
        self.subRightGroupName = row[21]
        self.subCGroupId = row[22]
        self.subCGroupName = row[23]
        self.channelGroups = []
        self.LR = 1 if (row[12] is not None or row[14] is not None or row[18] is not None or row[20] is not None or row[22] is not None) else 0;
        self.xover = row[24]

        # Combine all returned sub groups into single array
        i = 14
        while(i >= 0):
            grpId = row[8+i]
            grpName = row[9+i]
            if(grpId is not None and grpName is not None):
                grpType = int(i/2) if i>0 else 0;
                self.channelGroups.append(ChannelGroup(grpId, grpName, grpType)) # i becomes channel type indicator

            i = i-2;
            if len(self.channelGroups) and i < 2: # Skip final group if subs or tops groups have been found, only use for point sources
                i = -1;

        logging.info(f'Created source group - {self.groupId} / {self.name}')


########## Created in R1, contain individual channels ########
class ChannelGroup:
    def __init__(self, groupId, name, type):
        self.groupId = groupId
        self.name = name
        self.channels = []
        self.type = type;

        logging.info(f'Created channel group - {self.groupId} / {self.name} / {self.type}')


###### An amplifier channel ########
class Channel:
    def __init__(self, row):
        self.groupId = row[0]
        self.name = row[1]
        self.targetId = row[2]
        self.targetChannel = row[3]
        self.preset = row[4]
        self.cabId = row[5]

        logging.info(f'Created channel - {self.name}')


### Load template file + templates within from .r2t file ###
# Sections table contains template overview info
class TemplateFile(R1db):
    def __init__(self, f):
        super().__init__(f) #Inherit from parent class
        self.templates = []

    # Load all stored templates
    def loadTemplates(self):
        # Sections table contains
        self.cursor.execute('SELECT * FROM "main"."Sections" ORDER BY JoinedId ASC')
        templates  = self.cursor.fetchall()

        logging.info(f'Found {len(templates)} templates in file.')

        for idx, temp in enumerate(templates):
            joinedId = temp[3]
            self.cursor.execute(f'SELECT * FROM Controls WHERE JoinedId = {joinedId}') # Load controls
            controls = self.cursor.fetchall()

            self.templates.append(Template(temp, controls))
            logging.info(f'Loaded template - {idx} / {self.templates[-1].name}')



# Sections is table name from .r2t file
class Template:
    def __init__(self, sections, controls):
        if sections is not None:
            self.id = sections[0]
            self.name = sections[1]
            self.parentId = sections[2]
            self.joinedId = sections[3]

        if controls is not None:
            self.controls = controls



# Load project file + get joined id for new entries
class ProjectFile(R1db):

    # Find if inital R1 setup has been run
    def __initCheck(self):
        self.cursor.execute(f"SELECT * FROM sqlite_master WHERE name ='Groups' and type='table'")
        if self.cursor.fetchone() is None:
            logging.error(f'Could not find Groups table.')
            return -1;
        self.cursor.execute(f"SELECT * FROM sqlite_master WHERE name ='Views' and type='table'")
        if self.cursor.fetchone() is None:
            logging.error(f'Could not find Views table.')
            return -1;
        self.cursor.execute(f"SELECT * FROM Groups WHERE GroupId = 1 or ParentId = 1")
        rtn = self.cursor.fetchall()
        if rtn is None or len(rtn) < 3:
            logging.error(f'Could not find default groups.')
            return -1;

    # Deletes a project group and its children
    # Leading underscores define private function
    def __deleteGroup(self, gId):
        self.cursor.execute(f'SELECT GroupId FROM Groups WHERE ParentId = {gId}')
        children = self.cursor.fetchall();
        for child in children:
            self._ProjectFile__deleteGroup(child[0])

        logging.info(f'Deleting from groups - {gId}')
        return self.cursor.execute(f'DELETE FROM Groups WHERE GroupId = {gId}')

    def __init__(self, f, templates):
        super().__init__(f) #Inherit from parent class
        self.mId = 0;
        self.meterViewId = -1;
        self.masterViewId = -1
        self.subArray = []
        self.pId = -1;
        self.groups = []
        self.sourceGroups = []

        self.__clean()

        # Set joinedId start
        self.cursor.execute('SELECT JoinedId from Controls ORDER BY JoinedId DESC LIMIT 1')
        rtn = self.cursor.fetchone()
        if rtn is not None:
            self.jId = rtn[0] + 1
        else:
            print("Views have not been generated. Please run initial setup in R1 first.")
            logging.critical("Views have not been generated. Please run initial setup in R1 first.")
            sys.exit()

        self.pId = self.__createGroup(PARENT_GROUP_TITLE, 1)[0]

        # Find Master groupId
        self.cursor.execute('SELECT "GroupId" FROM Groups WHERE "ParentId" = 1 AND "Name" = "Master"')
        rtn = self.cursor.fetchone()
        if rtn is None:
            logging.critical('Cannot find Master group.')
        self.mId = rtn[0]

        self.__getSrcGrpInfo();


        if self.apEnable:
            apGroup = []
            for srcGrp in self.sourceGroups:
                if srcGrp.apEnable:
                    for chGrp in srcGrp.channelGroups:
                        if chGrp.type == 1 or chGrp.type == 4:
                            apGroup += chGrp.channels

            self.cursor.execute(
            f'  INSERT INTO Groups (Name, ParentId, TargetId, TargetChannel, Type, Flags) '
            f'  SELECT "{AP_GROUP_TITLE}", {self.pId}, 0, -1, 0, 0')
            self.cursor.execute(f'SELECT max(GroupId) FROM Groups')
            rtn = self.cursor.fetchone()
            if rtn is not None:
                self.apGroupId = rtn[0]
                for ch in apGroup:
                    self.cursor.execute(
                    f'  INSERT INTO Groups (Name, ParentId, TargetId, TargetChannel, Type, Flags) '
                    f'  SELECT "{ch.name}", {self.apGroupId}, {ch.targetId}, {ch.targetChannel}, 1, 0')

    def getChannelGroupTotal(self):
        i = 0;
        for srcGrp in self.sourceGroups:
            for chGrp in srcGrp.channelGroups:
                if chGrp.type == TYPE_SUBS or chGrp.type == TYPE_TOPS or chGrp.type == TYPE_POINT:
                    i += 1;
        return i

    def getMaxChannelGroupCount(self):
        i = 0;
        for srcGrp in self.sourceGroups:
            for chGrp in srcGrp.channelGroups:
                if len(chGrp.channels) > i:
                    i += len(chGrp.channels)
        return i

    def __getSubArrayGroup(self):
        subGroups = []
        str = ["L", "R", "C"]
        for s in str:
            self.cursor.execute(
            f' WITH RECURSIVE '
            f'   devs(GroupId, Name, ParentId, TargetId, TargetChannel, Type) AS ( '
            f'      SELECT GroupId, Name, ParentId, TargetId, TargetChannel, Type FROM Groups WHERE Name = (SELECT Name FROM SourceGroups WHERE Type = 3) '
            f'      UNION '
            f'      SELECT Groups.GroupId, Groups.Name, Groups.ParentId, Groups.TargetId, Groups.TargetChannel, Groups.Type FROM Groups, devs WHERE Groups.ParentId = devs.GroupId '
            f'   ) '
            f' SELECT GroupId, devs.Name, TargetId, TargetChannel, CabinetsAdditionalData.Name, Cabinets.CabinetId FROM devs '
            f' JOIN Cabinets '
            f' ON devs.TargetId = Cabinets.DeviceId '
            f' AND devs.TargetChannel = Cabinets.AmplifierChannel '
            f' JOIN CabinetsAdditionalData '
            f' ON Cabinets.CabinetId = CabinetsAdditionalData.CabinetId '
            f' WHERE Linked = 0 '
            f' AND devs.Name LIKE "%array {s}%" '
            )
            rtn = self.cursor.fetchall()
            if rtn is not None:
                subGroups.append(rtn)
        return subGroups;

    def __getSrcGrpInfo(self):
        self.cursor.execute(f'PRAGMA case_sensitive_like=ON;')

        self.cursor.execute(f'SELECT Name FROM SourceGroups WHERE Type = 3')
        rtn = self.cursor.fetchone()
        if rtn is not None:
            name = rtn[0]
            self.cursor.execute(
            f'  INSERT INTO Groups (Name, ParentId, TargetId, TargetChannel, Type, Flags)'
            f'  SELECT "{name}", (SELECT GroupId FROM Groups WHERE Name = "Left/Right"), 0, -1, 0, 0')
            self.cursor.execute(f'SELECT max(GroupId) FROM Groups')
            rtn = self.cursor.fetchone()
            if rtn is not None:
                mId = rtn[0]
                self.cursor.execute(
                f'  INSERT INTO Groups (Name, ParentId, TargetId, TargetChannel, Type, Flags)'
                f'  SELECT "{name + " SUBs"}", {mId}, 0, -1, 0, 0')
                self.cursor.execute(f'SELECT max(GroupId) FROM Groups')
                rtn = self.cursor.fetchone()
                if rtn is not None:
                    mId = rtn[0]
            str = [" SUBs L", " SUBs R", " SUBs C"]
            subArrayGroups = self.__getSubArrayGroup()
            for idx, subArrayGroup in enumerate(subArrayGroups):
                self.cursor.execute(
                f'  INSERT INTO Groups (Name, ParentId, TargetId, TargetChannel, Type, Flags)'
                f'  SELECT "{name+str[idx]}", {mId}, 0, -1, 0, 0'
                )
                self.cursor.execute(f'SELECT max(GroupId) FROM Groups')
                rtn = self.cursor.fetchone()
                if rtn is not None:
                    pId = rtn[0]
                for idy, subDevs in enumerate(subArrayGroup):
                    self.cursor.execute(
                    f'  INSERT INTO Groups (Name, ParentId, TargetId, TargetChannel, Type, Flags)'
                    f'  SELECT "{name+str[idx]}", {pId}, {subDevs[2]}, {subDevs[3]}, 1, 0'
                    )


        self.cursor.execute(
        f'  SELECT Views.ViewId, Views.Name, SourceGroups.SourceGroupId, NextSourceGroupId, SourceGroups.Type, ArrayProcessingEnable, ArraySightId, System, a.GroupId as MasterGroupId, a.Name as MasterGroupName, b.GroupId as TopGroupId, b.Name as TopGroupName, c.GroupId as TopLeftGroupId, c.Name as TopLeftGroupName, d.GroupId as TopRightGroupId, d.Name as TopRightGroupName, e.GroupId as SubGroupId, e.Name as SubGroupName, f.GroupId as SubLeftGroupId, f.Name as SubLeftGroupName, g.GroupId as '
        f'  SubRightGroupId, g.Name as SubRightGroupName, h.GroupId as SubCGroupId, h.Name as SubCGroupName, i.DisplayName as xover '
        f'  FROM Views JOIN SourceGroups  '
        f'  ON Views.Name = SourceGroups.Name  '
        f'  JOIN SourceGroupsAdditionalData  '
        f'  ON SourceGroups.SourceGroupId = SourceGroupsAdditionalData.SourceGroupId  '
        f'  JOIN Groups a '
        f'  ON a.Name = SourceGroups.Name '
        f'  LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% TOPs") b '
        f'  ON b.ParentId  = a.GroupId '
        f'  LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% TOPs R" ) c '
        f'  ON c.ParentId  = b.GroupId '
        f'  LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% TOPs L" ) d '
        f'  ON d.ParentId  = b.GroupId '
        f'  LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% SUBs") e '
        f'  ON e.ParentId  = a.GroupId '
        f'  LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% SUBs C") f '
        f'  ON f.ParentId  = e.GroupId '
        f'  LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% SUBs R") g '
        f'  ON g.ParentId  = e.GroupId '
        f'  LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% SUBs L") h '
        f'  ON h.ParentId  = e.GroupId '
        f'  LEFT OUTER JOIN (SELECT * FROM Controls WHERE DisplayName = "100Hz" OR DisplayName = "Infra") i '
        f'  ON i.ViewId  = Views.ViewId '
        f'  WHERE OrderIndex != -1 '# Order index happens to be -1 if source group is second group in a stereo pair
        f'  AND a.GroupId IN (SELECT max(GroupId) FROM Groups GROUP BY Name) '# Get L/R group first if exists else get child of Master group
        f'  ORDER BY SourceGroups.SourceGroupId ASC '
        )

        rtn = self.cursor.fetchall();

        self.apEnable = 0
        for row in rtn:
            self.sourceGroups.append(SourceGroup(row))
            print(self.sourceGroups[-1].apEnable)
            if self.sourceGroups[-1].apEnable:
                self.apEnable = 1 ;

        # All channels
        for idx, srcGrp in enumerate(self.sourceGroups):
            for idy, devGrp in enumerate(srcGrp.channelGroups):
                self.cursor.execute(
                    f'  WITH RECURSIVE devs(GroupId, Name, ParentId, TargetId, TargetChannel, Type, Flags) AS ( '
                    f'       SELECT Groups.GroupId, Groups.Name, Groups.ParentId, Groups.TargetId, Groups.TargetChannel, Groups.Type, Groups.Flags FROM Groups WHERE Groups.ParentId = {devGrp.groupId} '
                    f'       UNION '
                    f'       SELECT Groups.GroupId, Groups.Name, Groups.ParentId, Groups.TargetId, Groups.TargetChannel, Groups.Type, Groups.Flags FROM Groups, devs WHERE Groups.ParentId = devs.GroupId '
                    f'   ) '
                    f'    '
                    f'  SELECT GroupId, devs.Name, TargetId, TargetChannel, CabinetsAdditionalData.Name, Cabinets.CabinetId FROM devs '
                    f'  JOIN Cabinets '
                    f'  ON devs.TargetId = Cabinets.DeviceId '
                    f'  AND devs.TargetChannel = Cabinets.AmplifierChannel '
                    f'  JOIN CabinetsAdditionalData '
                    f'  ON Cabinets.CabinetId = CabinetsAdditionalData.CabinetId '
                    f'  AND Linked = 0 '
                    f'  WHERE devs.type = 1 '
                    )
                rtn = self.cursor.fetchall()

                for row in rtn:
                    self.sourceGroups[idx].channelGroups[idy].channels.append(Channel(row))
                logging.info(f'Assigned {len(rtn)} channels to {devGrp.name}')




    # Create R1 group if does not already exist
    # Returns inserted row
    def __createGroup(self, name, parentId):
        if parentId is None:
            parentId = 1;
        s = (f'  INSERT INTO Groups (Name, ParentId, TargetId, TargetChannel, Type, Flags) '
        f'      SELECT "{name}", {parentId}, 0, -1, 0, 0  '
        f'      WHERE NOT EXISTS (SELECT 1 '
        f'      FROM Groups '
        f'      WHERE Name = "{name}"); ')
        self.cursor.execute(s);
        self.cursor.execute(f'SELECT * FROM Groups ORDER BY GroupId DESC LIMIT 1;')
        lastRow = self.cursor.fetchone()
        logging.info(f'Creating {name} group with id {lastRow[0]}')
        return lastRow



    ##### Insert input routing group triggers into project ####
    def createTriggers(self):
        logging.info(f'Creating SQL triggers.')

        for i in range(len(INPUT_TYPES)):
            tp = ipStr[i]
            gName = INPUT_TYPES[i]
            self.cursor.execute(
                f'  CREATE TRIGGER AUTOR1_{gName}_Add '
                f'	AFTER INSERT ON SnapshotValues WHEN  '
                f'		NEW.SnapshotId = (SELECT SnapshotId FROM Snapshots WHERE Name = "{INPUT_SNAP_NAME}") '
                f'		AND NEW.TargetProperty = "{tp}" '
                f'		AND NEW.Value = 1 '
                f'		AND NOT EXISTS (SELECT *  '
                f'			FROM Groups  '
                f'			WHERE TargetId = NEW.TargetId '
                f'			AND TargetChannel = NEW.TargetNode '
                f'			AND ParentId = (SELECT GroupId FROM Groups WHERE Name = "{gName}")) '
                f'    BEGIN '
                f'    	INSERT INTO Groups (Name, ParentId, TargetId, TargetChannel, Type) '
                f'    		SELECT "{PARENT_GROUP_TITLE}", 1, 0, -1, 0'
                f'    		WHERE NOT EXISTS (SELECT * '
                f'    		FROM Groups  '
                f'    		WHERE Name = "{PARENT_GROUP_TITLE}"); '
                f' '
                f'    	INSERT INTO Groups (Name, ParentId, TargetId, TargetChannel, Type) '
                f'    		SELECT "{gName}", (SELECT GroupId FROM Groups WHERE Name = "{PARENT_GROUP_TITLE}"), 0, -1, 0 '
                f'    		WHERE NOT EXISTS (SELECT 1  '
                f'    		FROM Groups  '
                f'    		WHERE Name = "{gName}"); '
                f' '
                f'    	INSERT INTO Groups (ParentId, Name, TargetId, TargetChannel, Type, Flags) '
                f'    		SELECT (SELECT GroupId FROM Groups WHERE Name = "{gName}"), Name, NEW.TargetId, NEW.TargetNode, 1, 0 '
                f'    		FROM AmplifierChannels '
                f'    			WHERE DeviceId = NEW.TargetId '
                f'    			AND AmplifierChannel = NEW.TargetNode; '
                f'   END; ')

            self.cursor.execute(
                f'    CREATE TRIGGER AUTOR1_{gName}_Remove '
                f'    	AFTER INSERT ON SnapshotValues WHEN  '
                f'    		NEW.SnapshotId = (SELECT SnapshotId FROM Snapshots WHERE Name = "{INPUT_SNAP_NAME}")  '
                f'    		AND NEW.TargetProperty = "{tp}" '
                f'    		AND NEW.Value = 0 '
                f'    		AND EXISTS (SELECT *  '
                f'    			FROM Groups  '
                f'    			WHERE TargetId = NEW.TargetId '
                f'    			AND TargetChannel = NEW.TargetNode '
                f'    			AND ParentId = (SELECT GroupId FROM Groups WHERE Name = "{gName}")) '
                f'    BEGIN '
                f'    	DELETE FROM Groups '
                f'    		WHERE ParentId = (SELECT GroupId FROM Groups WHERE Name = "{gName}") '
                f'    		AND TargetId = NEW.TargetId'
                f'	        AND TargetChannel = NEW.TargetNode;'
                f'    END;')

    # Remove SQL triggers from project file
    def removeTriggers(self):
        logging.info(f'Removing SQL triggers.')

        for i in INPUT_TYPES:
            s = f'DROP TRIGGER IF EXISTS AUTOR1_{i}_Add;'
            self.cursor.execute(s)
            s = f'DROP TRIGGER IF EXISTS AUTOR1_{i}_Remove;'
            self.cursor.execute(s)

    def __clean(self):
        self.removeTriggers()

        self.cursor.execute(f'DELETE FROM Views WHERE "Name" = "{MASTER_WINDOW_TITLE}"')
        logging.info(f'Deleted {MASTER_WINDOW_TITLE} view.')

        self.cursor.execute(f'DELETE FROM Views WHERE "Name" = "{METER_WINDOW_TITLE}"')
        logging.info(f'Deleted existing {METER_WINDOW_TITLE} view.')

        self.cursor.execute(f'SELECT Name FROM SourceGroups WHERE Type = 3')
        rtn = self.cursor.fetchone()
        if rtn is not None:
            subArrayName = rtn[0]
            self.cursor.execute(
            f'  DELETE FROM Groups WHERE Name = "{subArrayName + " SUBs L"}" '
            f'  OR Name = "{subArrayName + " SUBs R"}" '
            f'  OR Name = "{subArrayName + " SUBs C"}" '
            f'  OR Name = "{subArrayName + " SUBs"}" '
            )
            self.cursor.execute(f'  DELETE FROM Groups WHERE Name = "{subArrayName}" AND ParentId = (SELECT ParentId FROM Groups WHERE Name = "Left/Right")')

        self.cursor.execute(f'SELECT GroupId FROM Groups WHERE Name = "{PARENT_GROUP_TITLE}"')
        group = self.cursor.fetchone()
        if group is not None:
            pId = group[0]
            self.__deleteGroup(self.pId)
        logging.info(f'Deleted existing {PARENT_GROUP_TITLE} group.')

def createNavButtons(proj, templates):
    proj.cursor.execute(f'SELECT * FROM Views WHERE Type = "{1000}"')
    rtn = proj.cursor.fetchall()

    for row in rtn:
        vId = row[0]
        if vId != proj.masterViewId and vId != proj.meterViewId:
            proj.cursor.execute(f'UPDATE Controls SET PosY = PosY + {NAV_BUTTON_Y+20} WHERE ViewId = {vId}')
            __insertTemplate(proj, templates, 'Nav Button', 15, NAV_BUTTON_Y, vId, MASTER_WINDOW_TITLE, proj.meterViewId+1, -1, proj.cursor, None, None, None, None, None)


def __getTempControlsFromName(templates, tempName):
    for t in templates.templates:
        if t.name == tempName:
            return t.controls
    return -1;

def __getTempSize(templates, tempName):
    templates.cursor.execute(f'SELECT JoinedId FROM "main"."Sections" WHERE Name = "{tempName}"')
    rtn = templates.cursor.fetchone()
    if rtn is not None:
        jId = rtn[0]
    else:
        logging.info(f'{tempName} template not found.')
        return -1

    templates.cursor.execute(f'SELECT PosX, PosY, Width, Height FROM Controls WHERE JoinedId = {jId}')
    rtn = templates.cursor.fetchall()
    if rtn is not None:
        w = 0
        h = 0
        for row in rtn:
            if row[0]+row[2] > w:
                w = row[0]+row[2]
            if row[1]+row[3] > h:
                h = row[1]+row[3]
        return [w,h]
    else:
        logging.info(f'{tempName} template controls not found.')
        return -1


def __insertTemplate(proj, templates, tempName, posX, posY, viewId, displayName, targetId, targetChannel, cursor, width, height, joinedId, targetProp, targetRec):
    if joinedId is not None:
        jId = joinedId
    else:
        jId = proj.jId
        proj.jId = proj.jId + 1

    tempContents = __getTempControlsFromName(templates, tempName)

    for control in tempContents:
        tProp = targetProp
        tRec = targetRec
        tChannel = targetChannel
        tId = targetId
        w = width
        h = height
        dName = control[7]
        tType = control[21]

        if tId is None:
            tId = control[22]

        if tChannel is None:
            tChannel = control[23]

        if w is None:
            w = control[4]

        if height is None:
            h = control[5]


        if (control[1] == 12) or (control[1] == 4 and tType == 5): # If item is a Frame or a button to swap views
            if (displayName is not None) and (dName != 'Fallback') and (dName != 'Regular'):
                dName = displayName

        if dName is None:
            dName = ""

        if tProp is None:
            tProp = control[24]
        if tRec is None:
            tRec = control[25]

        for p in DEV_PROP_TYPES:
            if tProp == p:
                if tChannel > -1:
                    tChannel = 0 #Dante + digital info require channel ID to be 0
                    break

        proj.cursor.execute(f'INSERT INTO Controls ("Type", "PosX", "PosY", "Width", "Height", "ViewId", "DisplayName", "JoinedId", "LimitMin", "LimitMax", "MainColor", "SubColor", "LabelColor", "LabelFont", "LabelAlignment", "LineThickness", "ThresholdValue", "Flags", "ActionType", "TargetType", "TargetId", "TargetChannel", "TargetProperty", "TargetRecord", "ConfirmOnMsg", "ConfirmOffMsg", "PictureIdDay", "PictureIdNight", "Font", "Alignment", "Dimension") VALUES ("{str(control[1])}", "{str(control[2]+posX)}", "{str(control[3]+posY)}", "{str(w)}", "{str(h)}", "{str(viewId)}", "{dName}", "{str(jId)}", "{str(control[10])}", "{str(control[11])}", "{str(control[12])}", "{str(control[13])}", "{str(control[14])}", "{str(control[15])}", "{str(control[16])}", "{str(control[17])}", "{str(control[18])}", "{str(control[19])}", "{str(control[20])}", "{str(control[21])}", "{str(tId)}", "{str(tChannel)}", "{str(tProp)}", {tRec}, NULL, NULL, "{str(control[28])}", "{str(control[29])}", "{str(control[30])}", "{str(control[31])}", " ")')

    return __getTempSize(templates, tempName)
    #except:
    return tempContents


# Find a view's id from its name
def __getViewIdFromName(proj, name):
    proj.cursor.execute(f'SELECT ViewId FROM Views WHERE Name = "{name}"')
    rtn = proj.cursor.fetchone()[0]
    return rtn

def createMeterView(proj, templates):
    ## Get width + height of title to offset starting x + y
    templates.cursor.execute(f'SELECT Width, Height FROM Controls WHERE DisplayName = "METERS_TITLE"')
    rtn = templates.cursor.fetchone()
    if rtn is not None:
        meterW = rtn[0]
        meterH = rtn[1]
    else:
        logging.error('Could not find meter title.')
        return -1;

    # Get height of metering frame to get x and y spacing for each meter
    templates.cursor.execute(f'SELECT Height FROM Controls WHERE DisplayName = "METERS_GROUP_TITLE"')
    rtn = templates.cursor.fetchone()
    if rtn is not None:
        groupH = rtn[0]
        spacingX = meterW+METER_SPACING_X
        spacingY = meterH+METER_SPACING_Y
    else:
        logging.error('Could not find meter group template.')
        return -1;

    ####### CREATE VIEW #######
    # Get window width
    mWidth = (spacingX*proj.getChannelGroupTotal())+METER_SPACING_X
    mHeight = (spacingY*proj.getMaxChannelGroupCount())+METER_SPACING_Y
    proj.cursor.execute(f'INSERT INTO Views("Type","Name","Icon","Flags","HomeViewIndex","NaviBarIndex","HRes","VRes","ZoomLevel","ScalingFactor","ScalingPosX","ScalingPosY","ReferenceVenueObjectId") VALUES (1000,"{METER_WINDOW_TITLE}",NULL,4,NULL,-1,{mWidth},{mHeight},100,NULL,NULL,NULL,NULL);')
    proj.cursor.execute(f'SELECT max(ViewId) FROM Views')
    rtn = proj.cursor.fetchone()
    if rtn is not None:
        proj.meterViewId = rtn[0];


    ###### INSERT HEADER ######
    posX = METER_VIEW_STARTX
    posY = METER_VIEW_STARTY
    __insertTemplate(proj, templates, 'Nav Button', NAV_BUTTON_X, posY+NAV_BUTTON_Y, proj.meterViewId, MASTER_WINDOW_TITLE, proj.meterViewId+1, -1, proj.cursor, None, None, None, None, None)
    posY += __insertTemplate(proj, templates, 'Meters Title', posX, posY, proj.meterViewId, None, None, None, proj.cursor, None, None, None, None, None)[1]+METER_SPACING_Y
    startY = posY
    proj.cursor.execute(f'UPDATE Views SET VRes = {posY+mHeight} WHERE ViewId = {proj.meterViewId}')


    for srcGrp in proj.sourceGroups:
        subs = 0
        tops = 0
        for chGrp in srcGrp.channelGroups:
            if chGrp.type == 4 and subs: #Skip sub parent group if SUBs L/R/C group exists
                continue;
            if chGrp.type == 1 and tops: #Skip top parent group if Tops L/R group exists
                continue;
            dim = __insertTemplate(proj, templates, 'Meters Group', posX, posY, proj.meterViewId, chGrp.name, chGrp.groupId, None, proj.cursor, None, None, None, None, None);
            posY += dim[1]+10

            for ch in chGrp.channels:
                __insertTemplate(proj, templates, "Meter", posX, posY, proj.meterViewId, ch.name, ch.targetId, ch.targetChannel, proj.cursor, None, None, proj.jId, None, None);
                posY += spacingY

            if chGrp.type > 4: # SUB L/R/C group
                subs = 1;
            elif chGrp.type > 1 and chGrp.type < 4: # TOP L/R group
                tops = 1;

            posX += spacingX
            posY = startY
            proj.jId = proj.jId + 1

def createMasterView(proj, templates):
    ## Get width + height of templates used
    rtn = __getTempSize(templates, "Master Main")
    masterW = rtn[0]
    masterH = rtn[1]
    rtn = __getTempSize(templates, "Master ArraySight")
    asW = rtn[0]
    asH = rtn[1]
    rtn = __getTempSize(templates, "Master Title")
    titleW = rtn[0]
    titleH = rtn[1]
    rtn = __getTempSize(templates, "Group LR AP CPL2")
    meterW = rtn[0]
    meterH = rtn[1]

    print(f'masterW {masterW}')
    print(f'asW {asW}')
    print(f'meterW {meterW}')
    print(f'proj.getChannelGroupTotal() {proj.getChannelGroupTotal()}')
    print(f'proj.METER_SPACING_X() {METER_SPACING_X}')

    ####### CREATE VIEW #######
    HRes = masterW + asW + (meterW * proj.getChannelGroupTotal()) + (METER_SPACING_X*proj.getChannelGroupTotal()) + METER_SPACING_X # Last one is a buffer
    VRes = titleH + max([meterH, masterH]) + 60
    proj.cursor.execute(f'INSERT INTO Views("Type","Name","Icon","Flags","HomeViewIndex","NaviBarIndex","HRes","VRes","ZoomLevel","ScalingFactor","ScalingPosX","ScalingPosY","ReferenceVenueObjectId") VALUES (1000,"{MASTER_WINDOW_TITLE}",NULL,4,NULL,-1,{HRes},{VRes},100,NULL,NULL,NULL,NULL);')
    proj.cursor.execute(f'SELECT max(ViewId) FROM Views')
    rtn = proj.cursor.fetchone()
    if rtn is not None:
        proj.masterViewId = rtn[0];

    posX = 10
    posY = 10
    __insertTemplate(proj, templates, 'Nav Button', NAV_BUTTON_X, posY+NAV_BUTTON_Y, proj.masterViewId, METER_WINDOW_TITLE, proj.meterViewId, -1, proj.cursor, None, None, None, None, None)
    posY += __insertTemplate(proj, templates, 'Master Title', posX, posY, proj.masterViewId, None, None, None, proj.cursor, None, None, None, None, None)[1]+METER_SPACING_Y
    posX += __insertTemplate(proj, templates, 'Master Main', posX, posY, proj.masterViewId, None, proj.mId, None, proj.cursor, None, None, None, None, None)[0]+(METER_SPACING_X/2);
    asPos = __insertTemplate(proj, templates, 'Master ArraySight', posX, posY, proj.masterViewId, None, 0, None, proj.cursor, None, None, None, None, None)

    if proj.apEnable:
        posX += __insertTemplate(proj, templates, 'THC', posX, posY+asPos[1]+(METER_SPACING_Y/2), proj.masterViewId, None, proj.apGroupId, None, proj.cursor, None, None, None, None, None)[0]+(METER_SPACING_X*4);
    else:
        posX += asPos[0]+(METER_SPACING_X*4);

    for srcGrp in proj.sourceGroups:
        for idx, chGrp in enumerate(srcGrp.channelGroups):

            if chGrp.type > TYPE_SUBS or chGrp.type == TYPE_TOPS_L or chGrp.type == TYPE_TOPS_R: # TOP or SUB L/R/C Group
                continue;

            template = 'Group'
            if srcGrp.LR: # Stereo groups
                subGroups = [srcGrp.channelGroups[idx-2], srcGrp.channelGroups[idx-1]]
                print(subGroups[0].name + subGroups[1].name)
                template += ' LR'
            if srcGrp.apEnable:
                template += " AP"
            if ("GSL" in srcGrp.cabFamily) or ("KSL" in srcGrp.cabFamily):
                template += " CPL2"

            tempContents = __getTempControlsFromName(templates, template)
            metCh = 0 # Current channel of stereo pair
            mutCh = 0
            w = 0
            for control in tempContents:
                dName = control[7]
                tChannel = control[23]
                tId = chGrp.groupId
                flag = control[19]

                # Update Infra/100hz button text
                if (chGrp.type < TYPE_TOPS or chGrp.type > TYPE_TOPS_R) and dName == "CUT" and srcGrp.xover is not None:
                    dName = srcGrp.xover
                    logging.info(f"{chGrp.name} - Enabling {srcGrp.xover}")

                if (control[1] == CTRL_METER): #Meters, these require a TargetChannel
                    tId = chGrp.channels[0].targetId
                    tChannel = chGrp.channels[0].targetChannel
                if 'Group LR' in template:
                    if (control[1] == CTRL_METER): #Meters, these require a TargetChannel
                        tId = subGroups[metCh].channels[0].targetId
                        tChannel = subGroups[metCh].channels[0].targetChannel
                        metCh += 1
                    if (control[1] == CTRL_BUTTON) and (control[24] == "Config_Mute"): #Mute
                        tId = subGroups[mutCh].groupId
                        mutCh += 1

                if control[1] == CTRL_FRAME:
                    dName = chGrp.name
                    w = control[4]
                    if dName is None:
                        dName = ""

                if control[1] == CTRL_INPUT and control[24] == 'ChStatus_MsDelay' and ('fill' in chGrp.name.lower() or srcGrp.type > TYPE_TOPS_R):
                    flag = 14
                    logging.info(f"{chGrp.name} - Setting relative delay")

                s = f'INSERT INTO Controls ("Type", "PosX", "PosY", "Width", "Height", "ViewId", "DisplayName", "JoinedId", "LimitMin", "LimitMax", "MainColor", "SubColor", "LabelColor", "LabelFont", "LabelAlignment", "LineThickness", "ThresholdValue", "Flags", "ActionType", "TargetType", "TargetId", "TargetChannel", "TargetProperty", "TargetRecord", "ConfirmOnMsg", "ConfirmOffMsg", "PictureIdDay", "PictureIdNight", "Font", "Alignment", "Dimension") VALUES ("{str(control[1])}", "{str(control[2]+posX)}", "{str(control[3]+posY)}", "{str(control[4])}", "{str(control[5])}", "{str(proj.masterViewId)}", "{dName}", "{str(proj.jId)}", "{str(control[10])}", "{str(control[11])}", "{str(control[12])}", "{str(control[13])}", "{str(control[14])}", "{str(control[15])}", "{str(control[16])}", "{str(control[17])}", "{str(control[18])}", "{str(flag)}", "{str(control[20])}", "{str(control[21])}", "{str(tId)}", {str(tChannel)}, "{str(control[24])}", {control[25]}, NULL, NULL, "{str(control[28])}", "{str(control[29])}", "{str(control[30])}", "{str(control[31])}", "  ")'

                if control[1] == CTRL_INPUT and control[24] == 'Config_Filter3': # Remove CPL if not supported by channel / if channel doesn't have infra, cut button becomes infra
                    if (chGrp.type < TYPE_TOPS or chGrp.type > TYPE_TOPS_R) and srcGrp.xover is not None:
                        s = ""
                        logging.info(f"{chGrp.name} - Skipping CPL")

                proj.cursor.execute(s)

            __insertTemplate(proj, templates, 'Nav Button', posX, posY, proj.masterViewId, chGrp.name, srcGrp.viewId, -1, proj.cursor, None, None, None, None, None)

            posX += w+METER_SPACING_X
            proj.jId = proj.jId + 1
