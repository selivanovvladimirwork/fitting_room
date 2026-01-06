@echo off
cd /d D:\OSPanel\home\fittingadmin.loc
call D:\OSPanel\modules\system\local-env.cmd
php artisan migrate --force
pause
