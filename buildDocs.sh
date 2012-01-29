#!/bin/bash
# Yes, even though this is a bash script, it runs a windows executable, from windows.
# Download msys to get bash. http://www.mingw.org/wiki/MSYS  (or just execute the .bat
# from the cmd command line interpreter if on windows)
#
# If on Mac/Linux, get ruby (if you don't already have it), then:
#     [sudo] gem install jsduck
#     jsduck --config=buildDocs.config
#
vendor/jsduck/jsduck-3.3.1.exe --config=buildDocs.config