import sqlite3
import logging
import sys
from abc import ABCMeta, abstractmethod

PARENT_GROUP_TITLE = 'AUTO'
AP_GROUP_TITLE = 'AP'
METER_WINDOW_TITLE = "AUTO - Meters"
MASTER_WINDOW_TITLE = 'AUTO - Master'
SUBARRAY_GROUP_TEXT = 'Create SUBarray LR group? (y/n)\n(default: y): '
EXISTING_TEXT = 'Found existing AutoR1 group. Regenerate content? (y/n)\n(default: n): '
SUBARRAY_CTR_TEXT = 'Assign SUB Array C channel to L or R? (L/R)\n(default: L): '
INPUT_SNAP_NAME = "IP Config"

IPCONFIG_DEFAULT = [0,0,0,0,0,0,0,0]

ARRAYCALC_SNAPSHOT = 1 #Snapshot ID
INPUT_TYPES = ["A1", "A2", "A3", "A4", "D1", "D2", "D3", "D4"]
ipStr = ["Config_InputEnable1", "Config_InputEnable2", "Config_InputEnable3", "Config_InputEnable4", "Config_InputEnable5", "Config_InputEnable6", "Config_InputEnable7", "Config_InputEnable8"]
TARGET_ID = 3
SUBGROUP = 0
GROUPID = 0

ARRAY_TYPE = 10
POINTSOURCE_TYPE = 20
SUBARRAY_TYPE = 30;
SUBARRAY_GROUP_NAME_L = "SUB array L"
SUBARRAY_GROUP_NAME_R = "SUB array R"
SUBARRAY_GROUP_NAME_C = "SUB array C"

FB_OVERVIEW_POSX = 842
FB_OVERVIEW_POSY = 16
DS_STATUS_STARTX = FB_OVERVIEW_POSX
DS_STATUS_STARTY = 400
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

class Channel:
    def __init__(self, row):
        self.groupId = row[0]
        self.name = row[1]
        self.targetId = row[2]
        self.targetChannel = row[3]
        self.preset = row[4]
        self.cabId = row[5]

        logging.info(f'Created channel - {self.name}')

    def isSub(self):
        return "SUBs" in self.name;

    def isTop(self):
        return "TOPs" in self.name;

    @property
    def viewId(self):
        return self._viewId

    @viewId.setter
    def viewId(self, value):
        self._viewId = value

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

class SourceGroup:
    def __init__(self, row):
        self.viewId = row[0]
        self.name = row[1]
        self.srcId = row[2]
        self.nextSrcId = row[3]
        self.type = row[4]*10 if self.nextSrcId <= 0 else 40 # Group is stereo if nextSrcId exists
        self.apEnable = row[5]
        self.asId = row[6]
        self.cabFamily = row[7]
        self.groupId = row[8]
        self.groupName = row[9]
        self.groupChannels = []
        self.topGroupId = row[10]
        self.topGroupName = row[11]
        self.topGroupChannels = []
        self.subGroupId = row[12]
        self.subGroupName = row[13]
        self.subGroupChannels = []
        self.topLeftGroupId = row[14]
        self.topLeftGroupName = row[15]
        self.topLeftGroupChannels = []
        self.topRightGroupId = row[16]
        self.topRightGroupName = row[17]
        self.topRightGroupChannels = []
        self.subLeftGroupId = row[18]
        self.subLeftGroupName = row[19]
        self.subLeftGroupChannels = []
        self.subRightGroupId = row[20]
        self.subRightGroupName = row[21]
        self.subRightGroupChannels = []
        self.subCGroupId = row[22]
        self.subCGroupName = row[23]
        self.subCGroupChannels = []
        self.channelGroups = []
        self.subC = 0

        # Combine all returned sub groups into single array
        i = 14
        while(i >= 0): # Break if found top or sub groups
            if(row[8+i] is not None and row[9+i] is not None):
                self.channelGroups.append(ChannelGroup(row[8+i], row[9+i]))
            if(i < 8 and len(self.channelGroups) > 0): # Break if found top and sub groups
                i = -1;
            i = i-2;

        logging.info(f'Created source group - {self.groupId} / {self.name}')

class ChannelGroup:
    def __init__(self, groupId, name):
        self.groupId = groupId
        self.name = name
        self.channels = []

        logging.info(f'Created channel group - {self.groupId} / {self.name}')



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
    def initCheck(self):
        self.cursor.execute(f"SELECT * FROM sqlite_master WHERE name ='Groups' and type='table'")
        if self.cursor.fetchone() is None:
            return -1;
        self.cursor.execute(f"SELECT * FROM sqlite_master WHERE name ='Views' and type='table'")
        if self.cursor.fetchone() is None:
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
        self.ap = 0
        self.groups = []
        self.sourceGroups = []

        # Set joinedId start
        self.cursor.execute('SELECT JoinedId from Controls ORDER BY JoinedId DESC LIMIT 1')
        rtn = self.cursor.fetchone()
        if rtn is not None:
            self.jId = rtn[0] + 1
        else:
            print("Views have not been generated. Please run initial setup in R1 first.")
            logging.critical("Views have not been generated. Please run initial setup in R1 first.")
            sys.exit()

        #Load all channels + their input config
        self.channels = []
        self.cursor.execute(f'SELECT * FROM "main"."AmplifierChannels" ORDER BY DeviceId ASC, AmplifierChannel ASC')
        ampChannels = self.cursor.fetchall()
        for channel in ampChannels:
            targetId = channel[0]
            targetChannel = channel[1]
            name = channel[2]
            if name is not "" and name is not "Unused": # Avoid unnamed or unused channels

                # Find which inputs are enabled for this channel (D1, D2, D3, D4, A1, A2, A3, A4)
                ipConfig = IPCONFIG_DEFAULT
                for idx, s in enumerate(ipStr):
                    for s in ipStr:
                        self.cursor.execute(f'SELECT * FROM "main"."SnapshotValues" WHERE SnapshotId = {ARRAYCALC_SNAPSHOT} AND TargetId = {targetId} AND TargetNode = {targetChannel} AND TargetProperty = "{s}" AND Value = 1 ORDER BY TargetId')
                        rtn = self.cursor.fetchall()
                        ipConfig[idx] = len(rtn) # 0 for input not enabled, 1 for enabled
                #self.channels.append(Channel(channel, ipConfig))

        logging.info(f'{len(self.channels)} channels loaded.')

        self.pId = self.createGroup(PARENT_GROUP_TITLE, 1)[0]

        # Find Master groupId
        self.cursor.execute('SELECT "GroupId" FROM Groups WHERE "ParentId" = 1 AND "Name" = "Master"')
        rtn = self.cursor.fetchone()
        if rtn is None:
            logging.critical('Cannot find Master group.')
        self.mId = rtn[0]

        srcGroups = self.getSrcGrpInfo()
        self.ggg();

    def getChannelGroupTotal(self):
        i = 0;
        for srcGrp in self.sourceGroups:
            i += len(srcGrp.channelGroups)
        return i

    def getMaxChannelGroupCount(self):
        i = 0;
        for srcGrp in self.sourceGroups:
            for chGrp in srcGrp.channelGroups:
                if len(chGrp.channels) > i:
                    i += len(chGrp.channels)
        return i

    def getSubArrayGroup(self):
        subGroups = []
        str = ["L", "R", "C"]
        for s in str:
            self.cursor.execute(
            f' WITH RECURSIVE '
            f'   cnt(GroupId, Name, ParentId, TargetId, TargetChannel, Type) AS ( '
            f'      SELECT GroupId, Name, ParentId, TargetId, TargetChannel, Type FROM Groups WHERE Name = (SELECT Name FROM SourceGroups WHERE Type = 3) '
            f'      UNION '
            f'      SELECT Groups.GroupId, Groups.Name, Groups.ParentId, Groups.TargetId, Groups.TargetChannel, Groups.Type FROM Groups, cnt WHERE Groups.ParentId = cnt.GroupId '
            f'   ) '
            f' SELECT GroupId, cnt.Name, TargetId, TargetChannel, CabinetsAdditionalData.Name, Cabinets.CabinetId FROM cnt '
            f' JOIN Cabinets '
            f' ON cnt.TargetId = Cabinets.DeviceId '
            f' AND cnt.TargetChannel = Cabinets.AmplifierChannel '
            f' JOIN CabinetsAdditionalData '
            f' ON Cabinets.CabinetId = CabinetsAdditionalData.CabinetId '
            f' WHERE Linked = 0 '
            f' AND cnt.Name LIKE "%array {s}%" '
            )
            rtn = self.cursor.fetchall()
            if rtn is not None:
                subGroups.append(rtn)
        return subGroups;

    def ggg(self):
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
            subArrayGroups = self.getSubArrayGroup()
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
                    print(subDevs)
                    self.cursor.execute(
                    f'  INSERT INTO Groups (Name, ParentId, TargetId, TargetChannel, Type, Flags)'
                    f'  SELECT "{name+str[idx]}", {pId}, {subDevs[2]}, {subDevs[3]}, 1, 0'
                    )


        self.cursor.execute(
        f'  SELECT ViewId, Views.Name, SourceGroups.SourceGroupId, NextSourceGroupId, SourceGroups.Type, ArrayProcessingEnable, ArraySightId, System, a.GroupId as MasterGroupId, a.Name as MasterGroupName, b.GroupId as TopGroupId, b.Name as TopGroupName, c.GroupId as SubGroupId, c.Name as SubGroupName, d.GroupId as TopLeftGroupId, d.Name as TopLeftGroupName, e.GroupId as TopRightGroupId, e.Name as TopRightGroupName, f.GroupId as SubLeftGroupId, f.Name as SubLeftGroupName, g.GroupId as SubRightGroupId, g.Name as SubRightGroupName, h.GroupId as SubRightGroupId, h.Name as SubRightGroupName '
        f'  FROM Views JOIN SourceGroups  '
        f'  ON Views.Name = SourceGroups.Name  '
        f'  JOIN SourceGroupsAdditionalData  '
        f'  ON SourceGroups.SourceGroupId = SourceGroupsAdditionalData.SourceGroupId  '
        f'  JOIN Groups a '
        f'  ON a.Name = SourceGroups.Name '
        f'  LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% TOPs") b '
        f'  ON b.ParentId  = a.GroupId '
        f'  LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% SUBs") c '
        f'  ON c.ParentId  = a.GroupId '
        f'  LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% TOPs R" ) d '
        f'  ON d.ParentId  = b.GroupId '
        f'  LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% TOPs L" ) e '
        f'  ON e.ParentId  = b.GroupId '
        f'  LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% SUBs C") f '
        f'  ON f.ParentId  = c.GroupId '
        f'  LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% SUBs R") g '
        f'  ON g.ParentId  = c.GroupId '
        f'  LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% SUBs L") h '
        f'  ON h.ParentId  = c.GroupId '
        f'  WHERE OrderIndex != -1 ' #Order index happens to be -1 if source group is second group in a stereo pair
        f'  AND a.GroupId IN (SELECT max(GroupId) FROM Groups GROUP BY Name) '# Get L/R group first if exists else get child of Master group
        )

        rtn = self.cursor.fetchall();

        for row in rtn:
            self.sourceGroups.append(SourceGroup(row))

        # All channels
        for idx, srcGrp in enumerate(self.sourceGroups):
            for idy, devGrp in enumerate(srcGrp.channelGroups):
                self.cursor.execute(
                    f'  SELECT GroupId, Groups.Name, TargetId, TargetChannel, CabinetsAdditionalData.Name, Cabinets.CabinetId FROM Groups '
                    f'  JOIN Cabinets '
                    f'  ON Groups.TargetId = Cabinets.DeviceId '
                    f'  AND Groups.TargetChannel = Cabinets.AmplifierChannel '
                    f'  JOIN CabinetsAdditionalData '
                    f'  ON Cabinets.CabinetId = CabinetsAdditionalData.CabinetId '
                    f'  WHERE Groups.ParentId = {devGrp.groupId} '
                    f'  AND Linked = 0 '
                    )
                rtn = self.cursor.fetchall()

                for row in rtn:
                    self.sourceGroups[idx].channelGroups[idy].channels.append(Channel(row))
                logging.info(f'Assigned {len(rtn)} channels to {devGrp.name}')



    # Types:
    # 10 - Mono Top Array
    # 11 - Mono Sub Array
    # 20 - Point Source Top
    # 21 - Point Source Sub
    # 30 - Sub array
    # 40 - Stereo Top Array
    # 41 - Stereo Sub Array

    def getSrcGrpInfo(self):
        self.cursor.execute(
        f'  SELECT ViewId, Views.Name, SourceGroups.SourceGroupId, SourceGroups.Type, ArrayProcessingEnable, ArraySightId, System, NextSourceGroupId '
        f'  FROM Views JOIN SourceGroups '
        f'      ON Views.Name = SourceGroups.Name '
        f'      JOIN SourceGroupsAdditionalData '
        f'      ON SourceGroups.SourceGroupId = SourceGroupsAdditionalData.SourceGroupId '
        f'      WHERE OrderIndex != -1 '); #Order index happens to be -1 if source group is second group in a stereo pair

        srcGrps = self.cursor.fetchall()
        rtn = []
        for src in srcGrps:
            type = src[3]*10;
            if src[-1] > 0: # If stereo group
                type = 40;

            if type < 3: # Not stereo or sub array
                for i, t in enumerate([" TOPs", " SUBs"]):
                    self.cursor.execute(
                        f'  SELECT * FROM Groups '
                        f'  WHERE Name = "{src[1] + t}" '
                        )
                    rslt = self.cursor.fetchall()
                    if rslt is not None:
                        type += i;


            rtn.append([src[0], src[1], src[2], src[3], type, src[5], src[6]])


        return rtn

    # Create R1 group if does not already exist
    # Returns inserted row
    def createGroup(self, name, parentId):
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

    def clean(self):
        self.cursor.execute(f'SELECT ViewId FROM Views WHERE Name = "{MASTER_WINDOW_TITLE}"')
        view = self.cursor.fetchone()

        if view is not None:
            self.cursor.execute(f'DELETE FROM Views WHERE "Name" = "{MASTER_WINDOW_TITLE}"')
        logging.info(f'Deleted {MASTER_WINDOW_TITLE} view.')

        self.cursor.execute(f'SELECT ViewId FROM Views WHERE Name = "{METER_WINDOW_TITLE}"')
        view = self.cursor.fetchone()
        if view is not None:
            self.cursor.execute(f'DELETE FROM Views WHERE "Name" = "{METER_WINDOW_TITLE}"')
        logging.info(f'Deleted existing {METER_WINDOW_TITLE} view.')

        self.cursor.execute(f'SELECT GroupId FROM Groups WHERE Name = "{PARENT_GROUP_TITLE}"')
        group = self.cursor.fetchone()
        if group is not None:
            pId = group[0]
            self._ProjectFile__deleteGroup(self.pId)
        logging.info(f'Deleted existing {PARENT_GROUP_TITLE} group.')

def createNavButtons(proj, templates):
    proj.cursor.execute(f'SELECT * FROM Views WHERE Type = "{1000}"')
    rtn = proj.cursor.fetchall()

    for row in rtn:
        vId = row[0]
        if vId != proj.masterViewId and vId != proj.meterViewId:
            proj.cursor.execute(f'UPDATE Controls SET PosY = PosY + {NAV_BUTTON_Y+20} WHERE ViewId = {vId}')
            insertTemplate(proj, templates, 'Nav Button', 15, NAV_BUTTON_Y, vId, MASTER_WINDOW_TITLE, proj.meterViewId+1, -1, proj.cursor, None, None, None, None, None)



def getTempControlsFromName(templates, tempName):
    for t in templates.templates:
        if t.name == tempName:
            return t.controls
    return -1;

def getTempSize(templates, tempName):
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


def insertTemplate(proj, templates, tempName, posX, posY, viewId, displayName, targetId, targetChannel, cursor, width, height, joinedId, targetProp, targetRec):
    if joinedId is not None:
        jId = joinedId
    else:
        jId = proj.jId
        proj.jId = proj.jId + 1

    tempContents = getTempControlsFromName(templates, tempName)

    for row in tempContents:
        tProp = targetProp
        tRec = targetRec
        tChannel = targetChannel
        tId = targetId
        w = width
        h = height
        dName = row[7]
        tType = row[21]

        if tId is None:
            tId = row[22]

        if tChannel is None:
            tChannel = row[23]

        if w is None:
            w = row[4]

        if height is None:
            h = row[5]


        if (row[1] == 12) or (row[1] == 4 and tType == 5): # If item is a Frame or a button to swap views
            if (displayName is not None) and (dName != 'Fallback') and (dName != 'Regular'):
                dName = displayName

        if dName is None:
            dName = ""

        if tProp is None:
            tProp = row[24]
        if tRec is None:
            tRec = row[25]

        for p in DEV_PROP_TYPES:
            if tProp == p:
                if tChannel > -1:
                    tChannel = 0 #Dante + digital info require channel ID to be 0
                    break

        proj.cursor.execute(f'INSERT INTO Controls ("Type", "PosX", "PosY", "Width", "Height", "ViewId", "DisplayName", "JoinedId", "LimitMin", "LimitMax", "MainColor", "SubColor", "LabelColor", "LabelFont", "LabelAlignment", "LineThickness", "ThresholdValue", "Flags", "ActionType", "TargetType", "TargetId", "TargetChannel", "TargetProperty", "TargetRecord", "ConfirmOnMsg", "ConfirmOffMsg", "PictureIdDay", "PictureIdNight", "Font", "Alignment", "Dimension") VALUES ("{str(row[1])}", "{str(row[2]+posX)}", "{str(row[3]+posY)}", "{str(w)}", "{str(h)}", "{str(viewId)}", "{dName}", "{str(jId)}", "{str(row[10])}", "{str(row[11])}", "{str(row[12])}", "{str(row[13])}", "{str(row[14])}", "{str(row[15])}", "{str(row[16])}", "{str(row[17])}", "{str(row[18])}", "{str(row[19])}", "{str(row[20])}", "{str(row[21])}", "{str(tId)}", "{str(tChannel)}", "{str(tProp)}", {tRec}, NULL, NULL, "{str(row[28])}", "{str(row[29])}", "{str(row[30])}", "{str(row[31])}", " ")')

    return getTempSize(templates, tempName)
    #except:
    return tempContents

def findDevicesInGroups(cursor, parentId):
    cursor.execute(f'SELECT * FROM Groups WHERE ParentId = {parentId}')
    rtn = cursor.fetchall()
    ch = []
    for row in rtn:
        if row[TARGET_ID] == SUBGROUP: # If entry is not a device but a subgroup
            ch += findDevicesInGroups(cursor, row[GROUPID])
        else:
            for i in range(len(rtn)):
                cursor.execute(f'SELECT * FROM "main"."Cabinets" WHERE DeviceId = {row[3]} AND AmplifierChannel = {row[4]}')
                cabData = cursor.fetchone()
                if cabData is not None:
                    cursor.execute(f'SELECT * FROM "main"."CabinetsAdditionalData" WHERE CabinetId = {cabData[0]}')
                    cabAddData = cursor.fetchone()
                    if cabAddData is not None:
                        rtn[i] = rtn[i]+(parentId,cabData[3],cabAddData[1])
                    else:
                        logging.error(f'Cannot find additional cabinet data for {row[1]}')
                else:
                    logging.error(f'Cannot find cabinet data for {row[1]}')
            return rtn
    return ch

# Delete a view from project
def deleteView(proj, viewId):
    return proj.cursor.execute(f'DELETE FROM Views WHERE ViewId = {viewId};')

# Delete a control from a view
def deleteControl(proj, viewId):
    return proj.cursor.execute(f'DELETE FROM Controls WHERE ViewId = {viewId};')

# Find a view's id from its name
def getViewIdFromName(proj, name):
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
    proj.meterViewId = getViewIdFromName(proj, METER_WINDOW_TITLE)


    ###### INSERT HEADER ######
    posX = METER_VIEW_STARTX
    posY = METER_VIEW_STARTY
    insertTemplate(proj, templates, 'Nav Button', NAV_BUTTON_X, posY+NAV_BUTTON_Y, proj.meterViewId, MASTER_WINDOW_TITLE, proj.meterViewId+1, -1, proj.cursor, None, None, None, None, None)
    posY += insertTemplate(proj, templates, 'Meters Title', posX, posY, proj.meterViewId, None, None, None, proj.cursor, None, None, None, None, None)[1]+METER_SPACING_Y
    startY = posY
    proj.cursor.execute(f'UPDATE Views SET VRes = {posY+mHeight} WHERE ViewId = {proj.meterViewId}')


    for srcGrp in proj.sourceGroups:

        for chGrp in srcGrp.channelGroups:
            dim = insertTemplate(proj, templates, 'Meters Group', posX, posY, proj.meterViewId, chGrp.name, chGrp.groupId, None, proj.cursor, None, None, None, None, None);
            posY += dim[1]+10

            for ch in chGrp.channels:
            #def insertTemplate(proj, templates, tempName, posX, posY, viewId, displayName, targetId, targetChannel, cursor, width, height, joinedId, targetProp, targetRec):
                insertTemplate(proj, templates, "Meter", posX, posY, proj.meterViewId, ch.name, ch.targetId, ch.targetChannel, proj.cursor, None, None, proj.jId, None, None);
                posY += spacingY

            posX += spacingX
            posY = startY
            proj.jId = proj.jId + 1

def getGroupIdFromName(proj, name):
    proj.cursor.execute(f'SELECT GroupId FROM Groups WHERE Name = "{name}"')
    rtn = proj.cursor.fetchone()
    if rtn is not None:
        return rtn[0]
    else:
        return None

def getGroupFromId(groups, gId):
    for g in groups:
        if g.groupId == gId:
            return g
    return -1;

def createMasterView(proj, templates):
    ## Get width of widest control in master template
    rtn = getTempSize(templates, "Master Main")
    masterW = rtn[0]
    spacingX = masterW+METER_SPACING_X
    AsId = 0

    proj.cursor.execute(f'SELECT DeviceId FROM "main"."Devices" WHERE Model = "ArraySight"')
    AsId = proj.cursor.fetchone()
    if AsId is not None:
        proj.cursor.fetchone()[0]
    else:
        AsId = 0
        logging.info("Could not find ArraySight device.")

    ## Get width of widest control in ArraySight template
    rtn = getTempSize(templates, "Master ArraySight")
    asW = rtn[0]
    asH = rtn[1]
    spacingX += asW+METER_SPACING_X

    # Find count of mono and stereo groups
    gCount = 0
    gStCount = 0
    for g in proj.groups:
        if len(g.groupIdSt) > 1:
            gStCount += 1;
        else:
            gCount += 1;

    ## Get width of stereo group frame
    rtn = getTempSize(templates, "Group LR AP")
    meterW = rtn[0]
    meterH = rtn[1]
    spacingX += (meterW+METER_SPACING_X)*gStCount
    ## Get width of group frame
    rtn = getTempSize(templates, "Group AP")
    meterW = rtn[0]
    meterH = rtn[1]
    spacingX += (meterW+METER_SPACING_X)*gCount

    spacingX += METER_SPACING_X*4

    proj.cursor.execute(f'INSERT INTO Views("Type","Name","Icon","Flags","HomeViewIndex","NaviBarIndex","HRes","VRes","ZoomLevel","ScalingFactor","ScalingPosX","ScalingPosY","ReferenceVenueObjectId") VALUES (1000,"{MASTER_WINDOW_TITLE}",NULL,4,NULL,-1,{(spacingX)+METER_SPACING_X},1000,100,NULL,NULL,NULL,NULL);')
    proj.masterViewId = getViewIdFromName(proj, MASTER_WINDOW_TITLE)
    masterGroupId = getGroupIdFromName(proj, "Master")

    posX = 10
    posY = 10
    insertTemplate(proj, templates, 'Nav Button', NAV_BUTTON_X, posY+NAV_BUTTON_Y, proj.masterViewId, METER_WINDOW_TITLE, proj.meterViewId, -1, proj.cursor, None, None, None, None, None)
    posY += insertTemplate(proj, templates, 'Master Title', posX, posY, proj.masterViewId, None, None, None, proj.cursor, None, None, None, None, None)[1]+METER_SPACING_Y
    posX += insertTemplate(proj, templates, 'Master Main', posX, posY, proj.masterViewId, None, masterGroupId, None, proj.cursor, None, None, None, None, None)[0]+(METER_SPACING_X/2);
    asPos = insertTemplate(proj, templates, 'Master ArraySight', posX, posY, proj.masterViewId, None, AsId, None, proj.cursor, None, None, None, None, None)
    if proj.ap > 0:
        # def insertTemplate(proj, templates, tempName, posX, posY, viewId, displayName, targetId, targetChannel, cursor, width, height, joinedId, targetProp, targetRec):
        posX += insertTemplate(proj, templates, 'THC', posX, posY+asPos[1]+(METER_SPACING_Y/2), proj.masterViewId, None, proj.apGroupId, None, proj.cursor, None, None, None, None, None)[0]+(METER_SPACING_X*4);
    else:
        posX += asPos[0]+(METER_SPACING_X*4);
    for g in proj.groups:
        jId = proj.jId

        if " TOPs " in g.name or " SUBs " in g.name: # Skip L, R and master groups
            continue;
        template = 'Group'
        if hasattr(g, "childId"): # Stereo groups
            template += ' LR'
        if g.AP > 0:
            template += " AP"
        if g.isSl > 0:
            template += " CPL2"

        tempContents = getTempControlsFromName(templates, template)
        metCh = 0 # Current channel of stereo pair
        mutCh = 0
        w = 0
        for row in tempContents:
            dName = row[7]
            tChannel = row[23]
            tId = g.groupId
            flag = row[19]

            if g.type is 0 and dName == "CUT":
                dName = 'Infra'
                logging.info(f"{g.name} - Enabling Infra")

            if (row[1] == 12): #Get frame Width
                w = row[4]
            if (row[1] == 7): #Meters, these require a TargetChannel
                tId = g.targetChannels[0][3]
                tChannel = g.targetChannels[0][4]
            if 'Group LR' in template:
                if (row[1] == 7): #Meters, these require a TargetChannel
                    child = getGroupFromId(proj.groups, g.childId[metCh])
                    tId = child.targetChannels[0][3]
                    tChannel = child.targetChannels[0][4]
                    metCh += 1
                if (row[1] == 4) and (row[24] == "Config_Mute"): #Mute
                    child = getGroupFromId(proj.groups, g.childId[mutCh])
                    tId = child.groupId
                    mutCh += 1

            if row[1] == 12:
                dName = g.name

            if dName is None:
                dName = ""

            if row[1] == 3 and row[24] == 'ChStatus_MsDelay' and ('fill' in g.name.lower() or ('sub' in g.name.lower() and 'array' in g.name.lower())): # Remove CPL if not supported by channel / if channel doesn't have infra, cut button becomes infra
                flag = 14
                logging.info(f"{g.name} - Setting relative delay")

            s = f'INSERT INTO Controls ("Type", "PosX", "PosY", "Width", "Height", "ViewId", "DisplayName", "JoinedId", "LimitMin", "LimitMax", "MainColor", "SubColor", "LabelColor", "LabelFont", "LabelAlignment", "LineThickness", "ThresholdValue", "Flags", "ActionType", "TargetType", "TargetId", "TargetChannel", "TargetProperty", "TargetRecord", "ConfirmOnMsg", "ConfirmOffMsg", "PictureIdDay", "PictureIdNight", "Font", "Alignment", "Dimension") VALUES ("{str(row[1])}", "{str(row[2]+posX)}", "{str(row[3]+posY)}", "{str(row[4])}", "{str(row[5])}", "{str(proj.masterViewId)}", "{dName}", "{str(jId)}", "{str(row[10])}", "{str(row[11])}", "{str(row[12])}", "{str(row[13])}", "{str(row[14])}", "{str(row[15])}", "{str(row[16])}", "{str(row[17])}", "{str(row[18])}", "{str(flag)}", "{str(row[20])}", "{str(row[21])}", "{str(tId)}", {str(tChannel)}, "{str(row[24])}", {row[25]}, NULL, NULL, "{str(row[28])}", "{str(row[29])}", "{str(row[30])}", "{str(row[31])}", "  ")'

            if row[1] == 3 and row[24] == 'Config_Filter3': # Remove CPL if not supported by channel / if channel doesn't have infra, cut button becomes infra
                if not g.isTop():
                    s = ""
                    logging.info(f"{g.name} - Skipping CPL")

            proj.cursor.execute(s)

        insertTemplate(proj, templates, 'Nav Button', posX, posY, proj.masterViewId, g.name, g.viewId, -1, proj.cursor, None, None, None, None, None)

        posX += w+METER_SPACING_X
        proj.jId = proj.jId + 1
