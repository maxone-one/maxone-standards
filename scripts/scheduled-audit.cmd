@echo off
REM Manual-fallback audit run (Doppelklick).
REM
REM Standard 031: Der primäre Audit-Trigger ist die GitHub-Action
REM `.github/workflows/scheduled-audit.yml` auf dem `voltfair-server`-Runner
REM (Heartbeat-Plattform, läuft ohne User-NUC).
REM
REM Diese .cmd-Datei bleibt erhalten als manueller Notfall-Trigger,
REM wenn der Runner offline ist und ad-hoc gegen die NUC-lokale
REM Projekt-Sammlung gefahren werden soll. NICHT in einen
REM Windows-Task-Scheduler-Eintrag, NICHT in WSL crontab — beides
REM wäre ein Standard-031-Verstoß.

cd /d C:\Users\max\Projects\maxone-standards
set TIMESTAMP=%DATE:~-4%-%DATE:~-10,2%-%DATE:~-7,2%
git pull --ff-only > audits\fetch-%TIMESTAMP%.log 2>&1
node scripts\audit.mjs > audits\audit-%TIMESTAMP%.txt 2>&1
echo Done: audits\audit-%TIMESTAMP%.txt >> audits\fetch-%TIMESTAMP%.log
