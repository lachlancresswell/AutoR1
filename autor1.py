import sys
import os
from shutil import copyfile
from datetime import datetime
import platform
import r1py as r1
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

# Ensure exceptions are logged
def log_except_hook(*exc_info):
    text = "".join(traceback.format_exception(*exc_info))
    print(f"Unhandled exception: {text}")

sys.excepthook = log_except_hook


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


#Start logging
dateTimeObj = datetime.now()

if not os.path.exists(LOGDIR):
    os.makedirs(LOGDIR)
timestamp = dateTimeObj.strftime("%d-%b-%Y-%H-%M-%S")
logfn = LOGDIR+timestamp+'-autor1log.txt'
with open(logfn, 'w'): pass
logging.basicConfig(filename=logfn,level=logging.INFO)
logging.getLogger().setLevel(logging.INFO)
#logging.getLogger().addHandler(logging.StreamHandler(sys.stdout))

if not checkFile(logfn):
    print(f'Could not access {logfn}')
logging.info('Sys Args:')
for a in sys.argv:
    logging.info(f'{a}')
logging.info(f'cwd - {os.getcwd()}')
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

templates = r1.TemplateFile(TEMP_FILE)
project = r1.ProjectFile(MOD_FILE, templates)
r1.createParentGroup(project);
r1.createIpGroups(project);
r1.createMeterView(project, templates);
r1.createMasterView(project, templates);
r1.createNavButtons(project, templates)

print("Finished generating views, controls and groups.")
templates.close();
project.close();
sys.exit()
