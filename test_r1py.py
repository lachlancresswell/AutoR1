import logging
import sqlite3
import sys
import pytest
import r1py as r1
import autor1
from shutil import copyfile

TEMP_FILE = './templates.r2t'
DIRTY_FILE = './dirty.dbpr'
CLEAN_FILE = './clean.dbpr'
DEFAULT_FILE = './default.dbpr'


def test_cleanProjectFile():
    copyfile(DEFAULT_FILE, DIRTY_FILE)
    dirtyProj = r1.ProjectFile(DIRTY_FILE)
    tFile = r1.TemplateFile(TEMP_FILE)

    assert type(dirtyProj) is r1.ProjectFile
    assert type(tFile) is r1.TemplateFile

    initGrpCount = dirtyProj.getGroupCount()

    dirtyProj.pId = dirtyProj.createGroup(autor1.PARENT_GROUP_TITLE, 1)[0]
    dirtyProj.setSrcGrpInfo()
    autor1.configureApChannels(dirtyProj)

    autor1.createMeterView(dirtyProj, tFile)
    autor1.createMasterView(dirtyProj, tFile)
    autor1.createNavButtons(dirtyProj, tFile)

    queries = [
        # Master view
        f'SELECT * FROM Views WHERE "Name" = "{autor1.MASTER_WINDOW_TITLE}"',
        # Meter view
        f'SELECT * FROM Views WHERE "Name" = "{autor1.METER_WINDOW_TITLE}"',
        # AutoR1 group
        f'SELECT * FROM Groups WHERE Name = "{autor1.PARENT_GROUP_TITLE}"',
        # Nav controls
        f'SELECT * FROM Controls WHERE TargetId = {dirtyProj.masterViewId}',
        # Master view controls
        f'SELECT * FROM Controls WHERE ViewId = {dirtyProj.masterViewId}',
        # Meter view controls
        f'SELECT * FROM Controls WHERE ViewId = {dirtyProj.meterViewId}',
    ]

    for q in queries:
        dirtyProj.cursor.execute(q)
        assert dirtyProj.cursor.fetchone() is not None

    dirtyProj.close()
    copyfile(DIRTY_FILE, CLEAN_FILE)

    cleanProj = r1.ProjectFile(CLEAN_FILE)
    cleanProj.pId = dirtyProj.pId
    cleanProj = autor1.clean(
        cleanProj, dirtyProj.masterViewId, dirtyProj.meterViewId)
    postGrpCount = cleanProj.getGroupCount()
    assert postGrpCount == initGrpCount

    for q in queries:
        cleanProj.cursor.execute(q)
        assert cleanProj.cursor.fetchone() is None

    cleanProj.close()


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
    projFile = r1.ProjectFile(DEFAULT_FILE)
    assert type(projFile) is r1.ProjectFile
