# Pipfix

Python and pip installation analyser and visualiser.

![visualisation of pipfix results](images/graph00.png "visualisation pic")
*Visualisation of the default Python installation on a Mac in Sierra, 
following the installation of `pip` using `brew install pip`:*

## Introduction


Ever been confused about:
- How many versions of `python` you have installed on your mac?
- How many versions of `pip` are there installed?
- How to have pip for mac system python and pip for python.org python co-existing at the same time?
- Is there a valid version of `pip` that serves **each** python you have installed?
- Which site-package locations are being used by which python and pip?
- Are any site-package locations (and thus packages) being shared between pythons?

Run this report tool and find out your python installation and pip installation situation.  Especially on Mac, the system python may clash in some ways with a third party python installed from python.org or via brew.

Miniconda and Anaconda python installs are fairly independent and don't really factor into this analysis - however, for completeness, this tool will also (in time) report if you have conda technology python installed.  Done, use the `--anacondas` option


# Installation

## Quick Steps ##

- git clone https://github.com/abulka/pipfix.git
- ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
- brew install node
- brew install graphviz  (optional as the npm viz module seems to have its own graphviz binaries)
- brew install coreutils
- cd pipfix
- npm install
- npm test
- npm start

Ubuntu: brew would be replaced with
- sudo apt-get install coreutils
- etc.

Then simply node `pipfix.js --visualise`

## Sample Python 3 installation

![visualisation of pipfix results](images/graph02.png "visualisation of which pip points to which python")

## Usage

$ node pipfix.js --help

   pipfix.js 1.0.0 - Reports python installed and any related pips
     
   USAGE

     pipfix.js 

   OPTIONS

     --advice         Generate advice                                                                 optional      
     --report         Generate JSON report                                                            optional      
     --visualise      Visualise as graph in browser                                                   optional      
     --anacondas      Scan for multiple virtual Anaconda pythons (may be slow if you have a lot)      optional       

   GLOBAL OPTIONS

     -h, --help         Display help                                      
     -V, --version      Display version                                   
     --no-color         Disable colors                                    
     --quiet            Quiet mode - only displays warn and error messages
     -v, --verbose      Verbose mode - will also output debug messages    



Sample report output [Go to this page](doco/sample1.pdf)
For detailed musings [Go to this page](doco/musings.md)
