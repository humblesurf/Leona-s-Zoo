$ErrorActionPreference='Stop'
$zooPython='C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'
& $zooPython scripts/build-animation-v4-1.py
if($LASTEXITCODE -ne 0){throw 'Atlas packaging failed'}
& $zooPython scripts/optimize-v4-1.py
if($LASTEXITCODE -ne 0){throw 'Delivery encoding failed'}
node share/build-share-v4-1.mjs
if($LASTEXITCODE -ne 0){throw 'Portable build failed'}
node scripts/test-portable-v4-1.mjs
if($LASTEXITCODE -ne 0){throw 'Offline verification failed'}
