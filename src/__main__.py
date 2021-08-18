#!/usr/bin/env python
import sys
import os
from shutil import copyfile
from datetime import datetime
import platform
import r1py.r1py as r1
import autor1.autor1 as autor1
import logging
import traceback

############################## CONSTANTS ##############################
LOGDIR = './LOGS/'
PROJ_FILE = './r1.dbpr'
MOD_FILE = './R1_AUTO.dbpr'
TEMP_FILE = './templates.r2t'

############################## FUNCTIONS ##############################


def checkFile(path):
    try:
        f = open(path, 'r')
        f.close()
    except IOError:
        return False
    return True

############################## LOGGING #############################
# Ensure exceptions are logged

def main():
    dateTimeObj = datetime.now()

    if not os.path.exists(LOGDIR):
        os.makedirs(LOGDIR)
    timestamp = dateTimeObj.strftime("%d-%b-%Y-%H-%M-%S")
    logfn = LOGDIR+timestamp+'-autor1log.txt'
    with open(logfn, 'w'):
        pass

    if not checkFile(logfn):
        print(f'Could not access {logfn}')
    logging.basicConfig(filename=logfn, level=logging.INFO)
    autor1.log.removeHandler(logging.StreamHandler(sys.stdout))
    log = logging.getLogger(__name__)
    
    def exceptionHandler(type, value, tb):
        log.exception("Uncaught exception: {0}".format(str(value)))

    # Install exception handler
    sys.excepthook = exceptionHandler


    ############################## START ##############################


    # Clear screen, ensure correct cmd for OS + set CWD if on Mac
    if platform.system() == 'Windows':
        os.system('cls')
    else:
        os.system('clear')
        try:
            os.chdir(sys.argv[1]+'/')
        except:
            print('Could not get current working directory.')

    log.info('Sys Args:')
    for a in sys.argv:
        log.info(f'{a}')
    log.info(f'cwd - {os.getcwd()}')
    ##########################################################################################

    print('**AutoR1**\n')

    if not checkFile(PROJ_FILE):
        print(f'Could not access {PROJ_FILE}')
        sys.exit()

    if not checkFile(TEMP_FILE):
        print(f'Could not access {TEMP_FILE}')
        sys.exit()

    # Janky but simplifies deployment for the moment
    copyfile(PROJ_FILE, MOD_FILE)

    if not checkFile(MOD_FILE):
        print(f'Could not access {MOD_FILE}')
        sys.exit()

    tempFile = autor1.TemplateFile(TEMP_FILE)
    projFile = r1.ProjectFile(MOD_FILE)
    if projFile.isInitialised() < 1:
        raise Exception('Initial R1 setup not performed')
    autor1.clean(
        projFile)
    projFile.pId = projFile.createGrp(autor1.PARENT_GROUP_TITLE, 1)[0]
    autor1.createSubLRCGroups(projFile)
    autor1.getSrcGrpInfo(projFile)
    autor1.configureApChannels(projFile)
    autor1.createMeterView(projFile, tempFile)
    autor1.createMasterView(projFile, tempFile)
    autor1.createNavButtons(projFile, tempFile)

    print("Finished generating views, controls and groups.")
    tempFile.close()
    projFile.close()
    sys.exit()
    
if __name__ == '__main__':
    main()