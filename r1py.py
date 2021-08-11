import sqlite3
import logging
from abc import ABCMeta

SRC_TYPE_SUBARRAY = 3

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

IPCONFIG_DEFAULT = [0, 0, 0, 0, 0, 0, 0, 0]

ARRAYCALC_SNAPSHOT = 1  # Snapshot ID
INPUT_TYPES = ["A1", "A2", "A3", "A4", "D1", "D2", "D3", "D4"]
ipStr = ["Config_InputEnable1", "Config_InputEnable2", "Config_InputEnable3", "Config_InputEnable4",
         "Config_InputEnable5", "Config_InputEnable6", "Config_InputEnable7", "Config_InputEnable8"]
TARGET_ID = 3


DEV_PROP_TYPES = [
    'Status_SmpsFrequency', 'Status_MainsPowerPeak', 'Status_SmpsVoltage', 'Status_SmpsTemperature', 'Status_LockMode', 'Status_StatusText', 'Status_PwrOk', 'Settings_Buzzer', 'Settings_DeviceName', 'Settings_InputGainEnable', 'Settings_LockCmd', 'Settings_MCLEnable', 'Settings_PwrOn', 'Input_Analog_Gain', 'Input_Digital_Gain', 'Input_Digital_Mode', 'Input_Digital_Sync', 'Input_Digital_SampleStatus', 'Input_Digital_DsDataPri', 'Input_Digital_DsDataSec', 'Input_Digital_TxStream', 'Error_GnrlErr', 'Error_SmpsTempOff', 'Error_SmpsTempWarn']


##### An R1 SQL File (.dbpr project file or .r1t template file) #####
class R1db(object):
    __metaclass__ = ABCMeta

    def __init__(self, f):
        self.f = f
        self.db = sqlite3.connect(f)
        self.cursor = self.db.cursor()
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
        # Group is stereo if nextSrcId exists
        self.type = row[4]*10 if self.nextSrcId <= 0 else 40
        self.apEnable = row[5] if row[5] else 0
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
        self.LR = 1 if (row[12] is not None or row[14] is not None or row[18]
                        is not None or row[20] is not None or row[22] is not None) else 0
        self.xover = row[24]

        # Combine all returned sub groups into single array
        i = 14
        while(i >= 0):
            grpId = row[8+i]
            grpName = row[9+i]
            if(grpId is not None and grpName is not None):
                grpType = int(i/2) if i > 0 else 0
                # i becomes channel type indicator
                self.channelGroups.append(
                    ChannelGroup(grpId, grpName, grpType))

            i = i-2
            # Skip final group if subs or tops groups have been found, only use for point sources
            if len(self.channelGroups) and i <= 2:
                i = -1

        logging.info(f'Created source group - {self.groupId} / {self.name}')
        print(f'Created source group - {self.groupId} / {self.name}')


########## Created in R1, contain individual channels ########
class ChannelGroup:
    def __init__(self, groupId, name, type):
        self.groupId = groupId
        self.name = name
        self.channels = []
        self.type = type

        logging.info(
            f'Created channel group - {self.groupId} / {self.name} / {self.type}')


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
        super().__init__(f)  # Inherit from parent class
        self.templates = []

        try:
            self.cursor.execute(
                'SELECT * FROM "main"."Sections" ORDER BY JoinedId ASC')
        except:
            raise

        templates = self.cursor.fetchall()

        logging.info(f'Found {len(templates)} templates in file.')

        for idx, temp in enumerate(templates):
            joinedId = temp[3]
            self.cursor.execute(
                f'SELECT * FROM Controls WHERE JoinedId = {joinedId}')  # Load controls
            controls = self.cursor.fetchall()

            self.templates.append(Template(temp, controls))
            logging.info(
                f'Loaded template - {idx} / {self.templates[-1].name}')


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

    def getGroupCount(self):
        self.cursor.execute(
            f"SELECT * FROM Groups")
        return len(self.cursor.fetchall())

    # Find if inital R1 setup has been run
    def __initCheck(self):
        self.cursor.execute(
            f"SELECT * FROM sqlite_master WHERE name ='Groups' and type='table'")
        if self.cursor.fetchone() is None:
            print(
                f'Could not find Groups table. Run R1 initial setup before using AutoR1.')
            return -1
        self.cursor.execute(
            f"SELECT * FROM sqlite_master WHERE name ='Views' and type='table'")
        if self.cursor.fetchone() is None:
            print(
                f'Could not find Views table. Run R1 initial setup before using AutoR1.')
            return -1
        self.cursor.execute(
            f"SELECT * FROM Groups WHERE GroupId = 1 or ParentId = 1")
        rtn = self.cursor.fetchall()
        if rtn is None or len(rtn) < 3:
            print(
                f'Could not find default groups. Run R1 initial setup before using AutoR1.')
            return -1

        return 1

    def deleteGroup(self, groupID):
        """Delete an item and any children from the group table

        Args:
            gId (int): GroupID to delete
        """
        self.cursor.execute(
            f'SELECT GroupId FROM Groups WHERE ParentId = {groupID}')
        children = self.cursor.fetchall()
        for child in children:
            self.deleteGroup(child[0])

        # Logging
        self.cursor.execute(
            f'SELECT Name FROM Groups WHERE GroupId = {groupID}')
        name = self.cursor.fetchone()[0]
        self.cursor.execute(
            f'SELECT ParentId FROM Groups WHERE GroupId = {groupID}')
        pId = self.cursor.fetchone()[0]
        self.cursor.execute(
            f'SELECT Name FROM Groups WHERE GroupId = {pId}')
        pName = self.cursor.fetchone()[0]
        logging.info(f'Deleting from groups - {groupID}')
        print(f'Deleting {name} from {pName}')

        self.cursor.execute(
            f'DELETE FROM Groups WHERE GroupId = {groupID}')

    def __init__(self, f):
        super().__init__(f)  # Inherit from parent class
        self.mId = 0
        self.meterViewId = -1
        self.masterViewId = -1
        self.subArray = []
        self.pId = -1
        self.groups = []
        self.sourceGroups = []

        if self.__initCheck() < 0:
            raise ValueError('Initial R1 setup not')

        self.mId = self.getMasterID()
        self.getNextJoinedID()

    def getMasterID(self):
        """Find GroupID of the default Master group

        Raises:
            RuntimeError: Master group cannot be found

        Returns:
            int: GroupID of Master group
        """
        self.cursor.execute(
            'SELECT "GroupId" FROM Groups WHERE "ParentId" = 1 AND "Name" = "Master"')
        rtn = self.cursor.fetchone()
        if rtn is None:
            raise RuntimeError('Cannot find Master group')
        return rtn[0]

    def getNextJoinedID(self):
        """Set the next valid JoinedID

        Raises:
            RuntimeError: Initial R1 setup hasn't been ran as no controls are not present
        """

        self.cursor.execute(
            'SELECT JoinedId from Controls ORDER BY JoinedId DESC LIMIT 1')
        rtn = self.cursor.fetchone()
        if rtn is not None:
            self.jId = rtn[0] + 1
        else:
            raise RuntimeError(
                "Views have not been generated. Please run initial setup in R1 first.")

    def getChannelMasterGroupTotal(self):
        i = 0
        for srcGrp in self.sourceGroups:
            for chGrp in srcGrp.channelGroups:
                if chGrp.type == TYPE_SUBS or chGrp.type == TYPE_TOPS or chGrp.type == TYPE_POINT:
                    i += 1
        return i

    def getChannelMeterGroupTotal(self):
        i = 0
        j = 0
        for srcGrp in self.sourceGroups:
            skip = 0
            for chGrp in srcGrp.channelGroups:
                if skip:
                    skip = 0
                    continue

                if chGrp.type == TYPE_SUBS_R or chGrp.type == TYPE_TOPS_R:
                    skip = 1
                i += 1
                j = max(j, len(chGrp.channels))

        return [i, j]

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
                f' /* Sub arrays always end with either L/C/R, two numbers, a dash and a further two numbers */'
                f' AND devs.Name LIKE "% {s}__%" '
            )
            rtn = self.cursor.fetchall()
            if rtn is not None and len(rtn):
                subGroups.append(rtn)
        return subGroups

    def setSrcGrpInfo(self):
        self.cursor.execute(f'PRAGMA case_sensitive_like=ON;')

        self.cursor.execute(
            f'SELECT Name FROM SourceGroups WHERE Type = {SRC_TYPE_SUBARRAY}')
        rtn = self.cursor.fetchone()
        if rtn is not None:
            name = rtn[0]
            self.createGrp(name, self.pId)
            self.cursor.execute(f'SELECT max(GroupId) FROM Groups')
            rtn = self.cursor.fetchone()
            if rtn is not None:
                mId = rtn[0]
                self.createGrp(name + " SUBs", mId)
                self.cursor.execute(f'SELECT max(GroupId) FROM Groups')
                rtn = self.cursor.fetchone()
                if rtn is not None:
                    mId = rtn[0]
            str = [" SUBs L", " SUBs R", " SUBs C"]
            subArrayGroups = self.__getSubArrayGroup()
            for idx, subArrayGroup in enumerate(subArrayGroups):
                self.createGrp(name+str[idx], mId)

                self.cursor.execute(f'SELECT max(GroupId) FROM Groups')
                rtn = self.cursor.fetchone()
                if rtn is not None:
                    pId = rtn[0]
                for idy, subDevs in enumerate(subArrayGroup):
                    self.createGrp(
                        subDevs[1], pId, subDevs[2], subDevs[3], 1, 0)

        self.cursor.execute(
            f' SELECT Views.ViewId, Views.Name, SourceGroups.SourceGroupId, NextSourceGroupId, SourceGroups.Type, ArrayProcessingEnable,  '
            f' ArraySightId, System, masterGroup.GroupId as MasterGroupId, masterGroup.Name as MasterGroupName, topsGroup.GroupId as TopGroupId, topsGroup.Name as TopGroupName,  '
            f' topsLGroup.GroupId as TopLeftGroupId, topsLGroup.Name as TopLeftGroupName, topsRGroup.GroupId as TopRightGroupId, topsRGroup.Name as TopRightGroupName,  '
            f' subsGroup.GroupId as SubGroupId, subsGroup.Name as SubGroupName, subsLGroup.GroupId as SubLeftGroupId, subsLGroup.Name as SubLeftGroupName, subsRGroup.GroupId as '
            f' SubRightGroupId, subsRGroup.Name as SubRightGroupName, subsCGroup.GroupId as SubCGroupId, subsCGroup.Name as SubCGroupName, i.DisplayName as xover '
            f' FROM SourceGroups '
            f' /* Combine additional source group data */ '
            f' JOIN SourceGroupsAdditionalData  '
            f' ON SourceGroups.SourceGroupId = SourceGroupsAdditionalData.SourceGroupId '
            f' /* Combine view info */ '
            f' JOIN Views '
            f' ON Views.Name = SourceGroups.Name '
            f' /* Combine R1 groups to Source Groups - We only have the name to go on here */ '
            f' JOIN Groups masterGroup '
            f' ON SourceGroups.name = masterGroup.Name '
            f' /* Fetch TOPs groups which may or may not have L/R subgroups */ '
            f' LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% TOPs") topsGroup '
            f' ON topsGroup.ParentId = masterGroup.GroupId '
            f' /* Fetch L/R TOP groups which will be under the main TOPs groups */ '
            f' LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% TOPs L" ) topsLGroup '
            f' ON topsLGroup.ParentId  = topsGroup.GroupId '
            f' LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% TOPs R" ) topsRGroup '
            f' ON topsRGroup.ParentId  = topsGroup.GroupId '
            f' /* Fetch the SUBs groups */ '
            f' LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% SUBs") subsGroup '
            f' ON subsGroup.ParentId  = masterGroup.GroupId '
            f' /* Fetch L/R/C SUB groups we created earlier */ '
            f' LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% SUBs L" ) subsLGroup '
            f' ON subsLGroup.ParentId  = subsGroup.GroupId '
            f' LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% SUBs R" ) subsRGroup '
            f' ON subsRGroup.ParentId  = subsGroup.GroupId '
            f' LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% SUBs C" ) subsCGroup '
            f' /* Fetch crossover info for subs */ '
            f' ON subsCGroup.ParentId  = subsGroup.GroupId '
            f' LEFT OUTER JOIN (SELECT * FROM Controls WHERE DisplayName = "100Hz" OR DisplayName = "Infra") i '
            f' ON i.ViewId  = Views.ViewId '
            f' /* Skip unused channels group */ '
            f' WHERE SourceGroups.name != "Unused channels" '
            f' /* Skip duplicate groups in Master group _only for arrays_. We want L/R groups for arrays. */ '
            f' AND (SourceGroups.Type == 1 AND masterGroup.ParentId != (SELECT GroupId FROM Groups WHERE Name == "Master"))  '
            f' /* Skip existing Sub array group in Master */ '
            f' OR (SourceGroups.Type == 3 AND masterGroup.ParentId != (SELECT GroupId FROM Groups WHERE Name == "Master"))  '
            f' /* Get point source groups from Master group */ '
            f' OR (SourceGroups.Type == 2 AND masterGroup.ParentId == (SELECT GroupId FROM Groups WHERE Name == "Master")) '
            f'  ORDER BY SourceGroups.OrderIndex ASC '
        )

        rtn = self.cursor.fetchall()

        self.apEnable = 0
        for row in rtn:
            self.sourceGroups.append(SourceGroup(row))

            if self.sourceGroups[-1].apEnable:
                self.apEnable = 1

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
                    self.sourceGroups[idx].channelGroups[idy].channels.append(
                        Channel(row))
                logging.info(f'Assigned {len(rtn)} channels to {devGrp.name}')

    def createGrp(self, title, parentId=1, targetId=0, targetChannel=-1, type=0, flags=0):
        """Enter a group or an amp channel into the group table

        Args:
            title (string): Title for item
            parentId (int, optional): Parent groupId to put new group under. Defaults to 1 .
            targetId (int, optional): Device ID if entering channel. Defaults to 0.
            targetChannel (int, optional): Amp channel if entering a channel, -1 if entering a group. Defaults to -1.
            type (int, optional): 0 if creating group, 1 if entering channel. Defaults to 0.
            flags (int, optional): Unsure. 'Groups' group is always 1, all others are 0. Likely determines a permanent item. Defaults to 0.

        Returns:
            int: GroupID of the new item
        """
        self.cursor.execute(
            f'  INSERT INTO Groups (Name, ParentId, TargetId, TargetChannel, Type, Flags)'
            f'  SELECT "{title}", {parentId}, {targetId}, {targetChannel}, {type}, {flags}')

        self.cursor.execute(
            f'SELECT * FROM Groups ORDER BY GroupId DESC LIMIT 1;')
        groupId = self.cursor.fetchone()

        # Get parent name for logging
        self.cursor.execute(
            f'SELECT Name FROM Groups WHERE GroupId = {parentId}')
        pName = self.cursor.fetchone()[0]
        print(f'Inserted {title} under {pName}')
        logging.info(f'Inserted {title} under {pName}')

        return groupId

    def getGroupIdFromName(self, name):
        """Get GroupIDs of groups matching provided name

        Args:
            name (string): name of group(s) to find

        Raises:
            RuntimeError: Group cannot be found

        Returns:
            [int]: array of GroupIDs of matching groups
        """
        self.cursor.execute(
            f'SELECT GroupId FROM Groups WHERE Name = "{name}"')

        rtn = self.cursor.fetchone()
        if rtn is None:
            raise RuntimeError('Could not find group')
        return rtn

    def getViewIdFromName(self, name):
        """Get a View's ViewID from it's name

        Args:
            name (string): Name of View to retrieve ID for

        Raises:
            RuntimeError: View cannot be found

        Returns:
            int: Retrieved ViewId
        """
        self.cursor.execute(f'SELECT ViewId FROM Views WHERE Name = "{name}"')

        try:
            rtn = self.cursor.fetchone()
            return rtn[0]
        except:
            raise RuntimeError('View not found')
