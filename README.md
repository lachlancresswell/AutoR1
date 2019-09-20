## Download

**[Link](https://github.com/lachyc/AutoR1/releases)**

**Meter View**
![Meter View](https://i.imgur.com/tSDfxEx.png)

**Overview**
![Overview](https://imgur.com/cNPPtNd.png)

**Source View**
![Source View](https://imgur.com/Z1T5Gdf.png)

## Using AutoR1
1. Unzip downloaded file.
2. Copy R1 project to unzipped folder and rename to 'R1.dbpr'
2. Run R1 initial setup to generate all standard views
4. Double click 'start-macos.command' or 'start-windows.bat' depending on your OS


## Overview
- Create input groups

  Groups amp channels based on their input setting (e.g A1, A2, D1, D4 ). Inputs are taken from the ArrayCalc snapshot. Required for the DS10 D1/D2 info on the overview page.

- Create SUBarray LR groups

  Adds addition sub groups for L and R sides. Required for the Meter page.

- Create fallback controls

  Adds fallback controls to all group pages and the overview page.

- Create DS info

  Enables/disables ds info (D1/D2 pri/sec readouts on Overview, channel info on Meter page)

- Remove meter view

  Removes the meter page

- Create meters view

  Creates a meter for each channel in the project grouped by the standard/ArrayCalc grouping


## Notes
- templates.r2t

Load this as a template file in R1 to modify generated controls
