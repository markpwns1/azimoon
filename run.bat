@echo off
cd ..
call cordova build browser
xcopy /s /y "platforms/browser/www" "browser_build"
start "" "browser_build/index.html"