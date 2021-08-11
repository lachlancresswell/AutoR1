import logging
import sqlite3
import sys
import pytest
import r1py as r1
from shutil import copyfile

TEMP_FILE = './templates.r2t'
PROJ_FILE = './default.dbpr'
TEST_FILE = './test.dbpr'


def test_cleanProjectFile():

    pFile = r1.ProjectFile(TEST_FILE)
    tFile = r1.TemplateFile(TEMP_FILE)

    assert type(pFile) is r1.ProjectFile
    assert type(tFile) is r1.TemplateFile

    initGrpCount = pFile.getGroupCount()

    pFile.pId = pFile.createGroup(r1.PARENT_GROUP_TITLE, 1)[0]
    pFile.setSrcGrpInfo()
    pFile.configureApChannels()

    r1.createMeterView(pFile, tFile)
    r1.createMasterView(pFile, tFile)
    r1.createNavButtons(pFile, tFile)

    queries = [
        # Master view
        f'SELECT * FROM Views WHERE "Name" = "{r1.MASTER_WINDOW_TITLE}"',
        # Meter view
        f'SELECT * FROM Views WHERE "Name" = "{r1.METER_WINDOW_TITLE}"',
        # AutoR1 group
        f'SELECT * FROM Groups WHERE Name = "{r1.PARENT_GROUP_TITLE}"',
        # Nav controls
        f'SELECT * FROM Controls WHERE TargetId = {pFile.masterViewId}',
        # Master view controls
        f'SELECT * FROM Controls WHERE ViewId = {pFile.masterViewId}',
        # Meter view controls
        f'SELECT * FROM Controls WHERE ViewId = {pFile.meterViewId}',
    ]

    for q in queries:
        pFile.cursor.execute(q)
        assert pFile.cursor.fetchone() is not None

    pFile.clean()
    postGrpCount = pFile.getGroupCount()
    assert postGrpCount == initGrpCount

    for q in queries:
        pFile.cursor.execute(q)
        assert pFile.cursor.fetchone() is None


def test_loadTemplateFailure():
    with pytest.raises(sqlite3.OperationalError):
        r1.TemplateFile('./tempilates.r2t')


def test_loadTemplateSuccess():
    tempFile = r1.TemplateFile(TEMP_FILE)
    assert type(tempFile) is r1.TemplateFile


def test_loadProjectFailure():
    with pytest.raises(ValueError):
        r1.ProjectFile('./tempilates.r2t')


def test_loadProjectSuccess():
    projFile = r1.ProjectFile(PROJ_FILE)
    assert type(projFile) is r1.ProjectFile
