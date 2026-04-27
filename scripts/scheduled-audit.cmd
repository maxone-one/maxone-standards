@echo off
REM Scheduled audit run — fired by Windows Task Scheduler
REM Created 2026-04-27 for one-shot execution at 2026-05-11 10:00

cd /d C:\Users\max\Projects\maxone-standards
set TIMESTAMP=%DATE:~-4%-%DATE:~-10,2%-%DATE:~-7,2%
git pull --ff-only > audits\fetch-%TIMESTAMP%.log 2>&1
node scripts\audit.mjs > audits\audit-%TIMESTAMP%.txt 2>&1
echo Done: audits\audit-%TIMESTAMP%.txt >> audits\fetch-%TIMESTAMP%.log
