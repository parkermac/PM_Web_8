# README for PM_Web_8

### This is a new version of my website.  It starts as a copy of PM_Web_7, and I will manage it in Dreamweaver for now, including using existing templates.  The main difference will be in publication: I will not use the Dreamweaver tool for pushing it to homer, but will instead save it as a Git repo and pull from homer.

First I copied it, made the repo, and published.

Then in Dreamweaver I used Site -> New Site... and pointed to this folder.  I did not add a server.

The new process for pushing updates is cumbersome compared to doing it in Dreamweaver:

- Edit site in Dreamweaver
- Save changes in GitHub Desktop
- Logon to homer, cd to /hw00/d47/pmacc, and do git pull
- Logon to apogee, cd to LO/misc, and do ./update_website.sh to make sure the movies and tracks are the latest versions.  I will want to see what happens when I do git pull after the movies and tracks have been updated on homer.
