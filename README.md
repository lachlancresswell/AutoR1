v1.6.0

## Download

### Combined Mac + Windows package:
**[Link](https://github.com/lachyc/AutoR1/releases)**

**Master View**
![Master View](https://i.imgur.com/owTAui2.png)

**Meter View**
![Meter View](https://i.imgur.com/lwmrZE1.png)

## Using AutoR1
1. Ensure you have run the R1 initial setup on your project to generate all standard views and groups and have saved.
2. Download and unzip AutoR1.
3. Copy R1 project into downloaded folder and rename to 'R1.dbpr'
4. Double click 'start-macos.command' or 'start-windows.bat' depending on your OS
5. Modified project file will be created in this folder called 'R1_AUTO.dbpr'

## Overview

- Create meters view

  Creates metering for ever channel in every source in the project.

- Create master view

  Creates an overall view of sources and channels with metering, fallback, status, ArraySight and ArrayProcessing controls.


## Notes
- templates.r2t

Load this as a template file in R1 to modify generated controls


## Building
- Download + configure python environment
```
git clone https://github.com/lachyc/AutoR1.git
cd ./AutoR1
virtualenv env
pip install -r requirements.txt
```

- Build for release - `pyinstaller --onefile --name autor1 src/__main__.py`

- Testing - `pytest`
  - Processed files will be located in Projects/Output/