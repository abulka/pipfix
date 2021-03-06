# Musings and Notes

Don't read this unless you are interested in random thoughts and experiments with various Python and pip installation scenarios.
Text is not really edited to a high standard yet.
Older versions of pipfix were used in producing these outputs.

## Automatic? ##

There are manual steps described below to do any fixes.  This may be automated at some point.

This tool reports on your Python 2 and Python 3 installations and any installations of `pip`.  Use this info, together with 
the information in this readme, to determine what to do.  The tool will suggest things to you, but will currently
not actually do anything.  The --visualisation option is the most useful thing to do

`pipfix.js --visualise`

# Running tests and debugging

The Node Inspector npm package is a debugger interface for Node.js but is deprecated, instead we now use the built in 
https://medium.com/@paul_irish/debugging-node-js-nightlies-with-chrome-devtools-7c4a1b95ae27
e.g. `node --inspect --debug-brk pipfix.js` which lets you debug in a chrome window, using the chrome visual debugger.

Run tests with 
- `npm test`
- `npm run BLAH` where BLAH is one the many run targets defined in `package.json` e.g. `npm run test_python_default`
- `./node_modules/mocha/bin/mocha --fgrep \"python exists and is valid\"` which only runs tests with that test in their `it` name e.g.  it('one blah blah and is default', function() {
- `./node_modules/mocha/bin/mocha test/test_class_python.js` run all the tests in a particular file
- `./node_modules/mocha/bin/mocha --inspect-brk --fgrep "python exists and is valid"` run a single test with chrome debugging.  Requires mocha > 3.3 see https://stackoverflow.com/questions/14352608/whats-the-right-way-to-enable-the-node-debugger-with-mochas-debug-brk-switch Remember to add a `debugger` line in your source code.

You can also debug using Visual Studio Code, without Chrome.  You need to create 'launch configurations' in `launch.json` - there are some included in this project in `.vscode/launch.json` - these are like what you do in PyCharm etc.  From the debug menu, you pick your configuration, then you run with debugging or without using the debug menu.  A bit strange that you have to run without debugging from the debug menu.  Oh well.  If you just want to run the run targets defined in `package.json` using Visual Studio Code then use the Tasks menu, which should list all of the tasks/targets it finds.

This code was developed using node 7.x but we are now up to node 9.x so upgrading needs to happen.  Seems to work in the newer version node. I've locked in some node npm packages but these could probably be updated, too.


# The main problem you may face

The main thing you want to do is get your python to have a package area managed by a `pip` command.  With virtual environments
that's exactly what you get.  But for 'system wide' pythons its a bit trickier.  Why would you have multiple 
system wide' pythons installed? - well on Mac there is a system python pre-installed, which you don't want to remove.  
You may want a newer version of python issued by python org foundation or via brew, so that you have the latest version of
python etc.  Bingo - you have two 'global' pythons.  You can invoke one or the other by direct invocation 
e.g. `/usr/bin/python` vs. `/usr/local/bin/python` or by playing around with your paths in your environment's $PATH.  
But what about the `pip` package manager - what's going on there - do you know?

## Not enough pips!

Background - the python 2.7.13 pip clash threat

Every since python.org's python 2.7.13 which ships with its own version of `pip`, there is a chance that it will **clobber** 
a mac system pip - because they both are installed into `/usr/local/bin`.  The mac does not ship with pip, but does ship 
with easy_install.  Nobody wants to use `easy_install` so most of us install `pip` - you can do so for mac system python
using the command `sudo easy_install pip` which puts pip into `/usr/local/bin` -  the __same location__ that python.org 
python 2.7.13 puts its pip.  

So how do we control package installations for both mac system python and python.org python - using the one `pip` ?

## Solution 

You have to install two pips, one for each python.  How?  See below 'Fixing your pip situation':

# Fixing your pip situation

## Scenario A

If you want just Mac system python, just install Mac system pip with `sudo easy_install pip`

## Scenario B

If you haven’t already done so, and want to install python org python 2.7.13 installer with its bundled pip then 
- install Mac system pip first with `sudo easy_install pip`
- rename Mac system pip from `/usr/local/bin/pip` to `/usr/local/bin/pips`. (Or whatever you prefer).  Same with pip2.7 and pip2
- Install python org, which will create `/usr/local/bin/pip` as the python org pip.  
- If you want to access Mac system pip then invoke `pips` (or whatever you called it), if you want to access python org pip then invoke `pip`.

## Scenario C

If you have already installed python org’s python and have lost access to Mac system pip
- Rename python org pip from `/usr/local/bin/pip` to `/usr/local/bin/pip_org` (or whatever - its potentially a temporary name).  Same with pip2.7 and pip2
- Install Mac pip with `sudo easy_install pip`
- If you want to access Mac system pip then invoke pip, if you want to access python org pip then invoke pip_org.

Note that if you want scenario C to result in the same naming convention for pip as scenario B, (namely pip is python org pip and pips is Mac system python) then add these steps to scenario C:
- `mv /usr/local/bin/pip  /usr/local/bin/pips`        # make Mac system pip known as pips
- `mv /usr/local/bin/pip_org  /usr/local/bin/pip`  # make python org pip known as pip
Do the same renaming move with pip2.7 and pip2 which also live in /usr/local/bin and which, like pip_org, you temporarily named pip2.7_org and pip2_org to prevent these files being clobbered by the python org 2.7.13 installer installing python org’s pip.
After which, now if you want to access Mac system pip then invoke `pips`, if you want to access python org pip then invoke `pip`.

```
pip list   # to see what’s in python org python (/usr/local/bin/python)
pips list  # to see what’s in Mac system python (/usr/bin/python)
```

to see what site package directory each pip is using:
```
pip --version   
pips —version
```

# APPENDIX

Various bits and pieces of info

## python locations

possibilities

Which Python | path
------------ | -------------
mac built in system python |   /usr/bin/python
home-brew           |     /usr/local/bin/python
python org          |       /usr/local/bin/python 
miniconda           |            ~/miniconda/bin/python
miniconda virtual envs |   e.g. ~/miniconda/envs/py2k/bin/python

```python -m site```

will show which site package locations are in place for each.  Thus

```/usr/bin/python -m site``` will show different info to
```/usr/local/bin/python -m site```

## pip locations

if pip doesn’t come with python, you can install it (e.g. via brew) and it will go into
`/usr/local/bin`
(cos you typically don’t install user based binaries into `/usr/bin`)
so the big question is… which python does it serve?  Ans: Looks like 

Which Python | path
------------ | -------------
mac built in python  |  /usr/bin/python
home-brew            |    /usr/local/bin/python
python org           |      /usr/local/bin/python 

are the candidates.  

At least we know that miniconda pips (main install and miniconda virtual envs) have their own locations for pip - 
so that’s sorted and OK.  

Assuming there is no brew python, then its a choice between 
- mac python
- python org python.

Confirmed that its mac python, if there is no python org python installed.

if python org python and it’s pip are installed - clash!!:
On the other hand:  If python org python is installed then brew’s `/usr/local/bin/pip` will be CLOBBERED by 
python org version of pip.  And the pip will presumably serve the python org python instead?  YES, CONFIRMED.  

The big question then is:  So how so we run pip commands to serve the built in mac python, in that case, 
if we want python org python too?  
If we don’t want python org python, then simply install pip with brew (which should then point to mac system python) 
or directly install pip using sudo easy_install pip which will hook up the mac pip.
Note if you also want or have installed brew python then don’t rely on brew pip to give you mac system python, 
of course it will point to brew python.  
But if you don’t install brew python, then installing brew pip is a workaround to get you a working pip.  
Its probably confusing though so better to go with the sudo easy_install pip solution.

## /System/Library/ vs /Library/

Apple's system version of Python is also not installed in the same place as Python from the Python Foundation (Apple puts it in 
`/System/Library/Frameworks `
and Python from the PF / python foundation / python org is installed to 
`/Library/Frameworks`

they are installed in separate locations so you won't lose the Apple supplied version.
Andy’s note: Though their pip’s will clash!  See above section for a workaround.

To reiterate:

path | Which Python
------------ | -------------
/Library/Frameworks/Python.framework...      |           is python org python installation location
/System/Library/Frameworks/Python.framework... |  is the Mac built in system python installation location

## Interesting Info: bins and packages and symbolic links
It is useful to distinguish between:

1. A BIN FILE `/usr/local/bin/pip` which is a script or symbolic link to a script invoking python
2. A LIBRARY BIN FILE `/Library/Frameworks/Python.framework/Versions/2.7/bin/pip` which is a script invoking python
3. A PACKAGE `/Library/Python/2.7/site-packages/pip-9….egg` which is the code module

Accessing the first two with direct command line invocations - easy.  

Accessing the third, the package, is, interestingly, also possible using the `python -m pip` syntax, below.

### python -m pip
How wonderous!

Note: `python -m pip` is a way of invoking the pip that is associated with you specific python, which is neat.

thus to invoke the python org pip:
`/usr/local/bin/python -m pip list`
Or simply use `/usr/local/bin/python/pip`
to invoke the python org pip?  YES CONFIRMED

thus to invoke the mac system python pip:
`/usr/bin/python -m pip`
assuming you had the foresight to install mac system python pip as a package BEFORE installing another version of python.  
If you didn’t, you can still install mac system pip package but the side effect will be to overwrite the auxiliary 
scripts in `/usr/local/bin/pip` - which can be backed up and restored I suppose.  
Or even renamed so that both pips are available :-) 

Even if you rename pip to e.g. pips in `/usr/local/bin` so that the mac pip is preserved, 
the invocation via the `python -m pip` technique remains unchanged, because you are not renaming the installed pip package, 
only renaming a script.

`pip --version`

Note: pip --version will tell you the version of pip and which site packages directory it is using

e.g. invoking python org pip using the following command:
```
/Library/Frameworks/Python.framework/Versions/2.7/bin/pip2.7 --version
```
pip 9.0.1 from /Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/site-packages (python 2.7)

## Background to the “python -m pip” invocation solution
since python org and mac system python pip both clash and put their pip command into the same location
`/usr/local/bin/pip` (albeit one does a script and the other does a symbolic link to a script) - 
is there a way to invoke pip differently?
Are we thus forced to use 
`/usr/bin/python -m pip list`
to serve mac python? NO, THIS WON’T WORK COS THERE IS NO PIP FOR MAC PYTHON.  
There used to be a pip for Mac python, when there was just pip installed via brew.  
( I usually install pip via brew, and which then services the default mac python, because I never install brew’s python)
But now its blown away.  
YEAH BUT if you install mac system python FIRST then the pip package will exist and can never be forgotten, 
and the `/usr/bin/python -m pip`
invocation technique should always work

The pip linking situation FOR python org pip
`ls -l /usr/local/bin/pip*`
yields
```
  lrwxrwxr-x  1 root  admin  65 23 Jan 16:22 /usr/local/bin/pip -> ../../../Library/Frameworks/Python.framework/Versions/2.7/bin/pip
  lrwxrwxr-x  1 root  admin  66 23 Jan 16:22 /usr/local/bin/pip2 -> ../../../Library/Frameworks/Python.framework/Versions/2.7/bin/pip2
  lrwxrwxr-x  1 root  admin  68 23 Jan 16:22 /usr/local/bin/pip2.7 -> ../../../Library/Frameworks/Python.framework/Versions/2.7/bin/pip2.7
```
All the above are symbolic links leading to a script, which invokes a specific version of python using the shebang technique

```
cat `which pip`
#!/Users/Andy/miniconda/bin/python
….
```

or

```
cat /usr/local/bin/pip
#!/usr/bin/python
….
```

The pip linking situation FOR mac system python pip
is different.  `/usr/local/bin/pip` is not a symbolic link to pip script. viz:
Interestingly, mac python puts the actual pip script (containing shebang invocation etc) in
`/usr/local/bin/pip` and puts nothing in `/System/Library…./bin`

Whereas python org does create a pip script in `/Library…./bin` and puts a symbolic link to that script in `usr/local/bin/pip`
This just means one less level of indirection and is no big deal if the actual script lives in `/usr/local/bin` in
the case of mac system python’s installation of pip using `sudo easy_install pip`

## Background to the multiple pips solution

Possible solutions I thought of to getting pip for mac python back again:

1. Perhaps we can install it again via brew - or its in a cellar somewhere?  And somehow avoid overwriting the python org pip in /usr/local/bin?  TOO COMPLEX

2. What about the advice: You can also just sudo easy_install pip if all you want is pip on stock Python from http://stackoverflow.com/questions/17271319/how-to-install-pip-on-macos-os-x/17271838#17271838.  Note, easy_install for mac python comes built in.  But won’t this blow away python org pip?  YES it will.  This apple system python invocation will add eggs etc. to '/Library/Python/2.7/site-packages' which is a mac system python site location, even though it doesn’t start with System/Library/… - it is definitely a system mac python only location.  And then, of course, creates pip symbolic links in /usr/local/bin - thus potentially overwriting the pip symbolic links to an earlier install of python org’s pip.  

So it sounds like the only solution is to save and rename the pip files in `/usr/local/bin` so that they don’t get 
overwritten and we have access to both pips - in the case of a combined mac python and python org python install.

That's the solution described at the top of this README.

## Python 3 and Python 2 co-existence information from python.org ##

Python.org Python 3.6 and 2.7.x versions can both be installed on your system and will not conflict. Command names for Python 3 contain a 3 in them, python3 (or python3.6), idle3 (or idle3.6), pip3 (or pip3.6), etc.  Python 2.7 command names contain a 2 or no digit: python2 (or python2.7 or python), idle2 (or idle2.7 or idle), etc.


# Multiple Pythons #

Let's explore what we get with multiple Python installations on a Mac.

## Default Python in Sierra ##

This is what you will see when you run `pipfix` on a fresh install of Sierra:

```
/usr/bin/python ---------- Object {
  "is_default": true,
  "path": "/usr/bin/python",
  "pip": Object {
    "installed": false,
    "site": undefined,
    "version": undefined,
  },
  "runs_ok": true,
  "sys.path": "12 entries",
  "version": "2.7.10",
  "warnings": Array [
    "pip module not installed",
  ],
}

Recommendations (1 pythons found, 0 pips found)
---------------
/usr/bin/python
   - has no pip
   - try "sudo easy_install pip" which puts pip into "/usr/local/bin"
```

The recommendation to install `pip`

```
...
creating /Library/Python/2.7/site-packages/pip-9.0.1-py2.7.egg
Extracting pip-9.0.1-py2.7.egg to /Library/Python/2.7/site-packages
Adding pip 9.0.1 to easy-install.pth file
Installing pip script to /usr/local/bin
Installing pip2.7 script to /usr/local/bin
Installing pip2 script to /usr/local/bin

Installed /Library/Python/2.7/site-packages/pip-9.0.1-py2.7.egg
Processing dependencies for pip
Finished processing dependencies for pip
```

will result in `pip` looking after the default mac Python.  Running `pipfix` again you can see:

```
$ node pipfix.js 

pipfix is analysing...
/usr/bin/python ---------- Object {
  "is_default": true,
  "path": "/usr/bin/python",
  "pip": Object {
    "installed": true,
    "site": "/Library/Python/2.7/site-packages",
    "version": "9.0.1",
  },
  "runs_ok": true,
  "sys.path": "13 entries",
  "version": "2.7.10",
}
/usr/local/bin/pip ---------- Object {
  "is_default": true,
  "path": "/usr/local/bin/pip",
  "runs_ok": true,
  "site": "/Library/Python/2.7/site-packages",
  "site_relationships": Object {
    "/usr/bin/python": true,
  },
  "version": "9.0.1",
}

Recommendations (1 pythons found, 1 pips found)
---------------
/usr/bin/python
   - ok

/usr/local/bin/pip
   - ok
```

Running pip will list the built in Python 2 packages.  Interesting that Sierra includes numpy !

```
$ pip list

altgraph (0.10.2)
bdist-mpkg (0.5.0)
bonjour-py (0.3)
macholib (1.5.1)
matplotlib (1.3.1)
modulegraph (0.10.4)
numpy (1.8.0rc1)
pip (9.0.1)
py2app (0.7.3)
pyobjc-core (2.5.1)
pyobjc-framework-Accounts (2.5.1)
pyobjc-framework-AddressBook (2.5.1)
pyobjc-framework-AppleScriptKit (2.5.1)
pyobjc-framework-AppleScriptObjC (2.5.1)
pyobjc-framework-Automator (2.5.1)
pyobjc-framework-CFNetwork (2.5.1)
pyobjc-framework-Cocoa (2.5.1)
pyobjc-framework-Collaboration (2.5.1)
pyobjc-framework-CoreData (2.5.1)
pyobjc-framework-CoreLocation (2.5.1)
pyobjc-framework-CoreText (2.5.1)
pyobjc-framework-DictionaryServices (2.5.1)
pyobjc-framework-EventKit (2.5.1)
pyobjc-framework-ExceptionHandling (2.5.1)
pyobjc-framework-FSEvents (2.5.1)
pyobjc-framework-InputMethodKit (2.5.1)
pyobjc-framework-InstallerPlugins (2.5.1)
pyobjc-framework-InstantMessage (2.5.1)
pyobjc-framework-LatentSemanticMapping (2.5.1)
pyobjc-framework-LaunchServices (2.5.1)
pyobjc-framework-Message (2.5.1)
pyobjc-framework-OpenDirectory (2.5.1)
pyobjc-framework-PreferencePanes (2.5.1)
pyobjc-framework-PubSub (2.5.1)
pyobjc-framework-QTKit (2.5.1)
pyobjc-framework-Quartz (2.5.1)
pyobjc-framework-ScreenSaver (2.5.1)
pyobjc-framework-ScriptingBridge (2.5.1)
pyobjc-framework-SearchKit (2.5.1)
pyobjc-framework-ServiceManagement (2.5.1)
pyobjc-framework-Social (2.5.1)
pyobjc-framework-SyncServices (2.5.1)
pyobjc-framework-SystemConfiguration (2.5.1)
pyobjc-framework-WebKit (2.5.1)
pyOpenSSL (0.13.1)
pyparsing (2.0.1)
python-dateutil (1.5)
pytz (2013.7)
scipy (0.13.0b1)
setuptools (18.5)
six (1.4.1)
xattr (0.6.4)
zope.interface (4.1.1)
```

Now lets install Python 3 from www.python.org.  Then run pipfix

```
pipfix is analysing...
/usr/bin/python ---------- Object {
  "is_default": true,
  "path": "/usr/bin/python",
  "pip": Object {
    "installed": true,
    "site": "/Library/Python/2.7/site-packages",
    "version": "9.0.1",
  },
  "runs_ok": true,
  "sys.path": "13 entries",
  "version": "2.7.10",
}
/usr/local/bin/python3 ---------- Object {
  "is_default": false,
  "path": "/usr/local/bin/python3",
  "pip": Object {
    "installed": true,
    "site": "/Library/Frameworks/Python.framework/Versions/3.6/lib/python3.6/site-packages",
    "version": "9.0.1",
  },
  "runs_ok": true,
  "sys.path": "5 entries",
  "version": "3.6.4",
}
/usr/local/bin/pip ---------- Object {
  "is_default": true,
  "path": "/usr/local/bin/pip",
  "runs_ok": true,
  "site": "/Library/Python/2.7/site-packages",
  "site_relationships": Object {
    "/usr/bin/python": true,
    "/usr/local/bin/python3": false,
  },
  "version": "9.0.1",
}
/usr/local/bin/pip3 ---------- Object {
  "is_default": false,
  "path": "/usr/local/bin/pip3",
  "runs_ok": true,
  "site": "/Library/Frameworks/Python.framework/Versions/3.6/lib/python3.6/site-packages",
  "site_relationships": Object {
    "/usr/bin/python": false,
    "/usr/local/bin/python3": true,
  },
  "version": "9.0.1",
}

Recommendations (2 pythons found, 2 pips found)
---------------
/usr/bin/python
   - ok

/usr/local/bin/python3
   - ok

/usr/local/bin/pip
   - ok

/usr/local/bin/pip3
   - ok

DONE 
```

Notice that Python 3 is now detected, along with its associated pip3.

What if we install python 3 using homebrew?  `brew install python3` 

```
...
Possible conflicting files are:
/usr/local/bin/2to3 -> /Library/Frameworks/Python.framework/Versions/3.6/bin/2to3
/usr/local/bin/2to3-3.6 -> /Library/Frameworks/Python.framework/Versions/3.6/bin/2to3-3.6
/usr/local/bin/idle3 -> /Library/Frameworks/Python.framework/Versions/3.6/bin/idle3
/usr/local/bin/idle3.6 -> /Library/Frameworks/Python.framework/Versions/3.6/bin/idle3.6
/usr/local/bin/pydoc3 -> /Library/Frameworks/Python.framework/Versions/3.6/bin/pydoc3
/usr/local/bin/pydoc3.6 -> /Library/Frameworks/Python.framework/Versions/3.6/bin/pydoc3.6
/usr/local/bin/python3 -> /Library/Frameworks/Python.framework/Versions/3.6/bin/python3
/usr/local/bin/python3-config -> /Library/Frameworks/Python.framework/Versions/3.6/bin/python3-config
/usr/local/bin/python3.6 -> /Library/Frameworks/Python.framework/Versions/3.6/bin/python3.6
/usr/local/bin/python3.6-config -> /Library/Frameworks/Python.framework/Versions/3.6/bin/python3.6-config
/usr/local/bin/python3.6m -> /Library/Frameworks/Python.framework/Versions/3.6/bin/python3.6m
/usr/local/bin/python3.6m-config -> /Library/Frameworks/Python.framework/Versions/3.6/bin/python3.6m-config
/usr/local/bin/pyvenv -> /Library/Frameworks/Python.framework/Versions/3.6/bin/pyvenv
/usr/local/bin/pyvenv-3.6 -> /Library/Frameworks/Python.framework/Versions/3.6/bin/pyvenv-3.6
...
...

Pip, setuptools, and wheel have been installed. To update them
  pip3 install --upgrade pip setuptools wheel

You can install Python packages with
  pip3 install <package>

They will install into the site-package directory
  /usr/local/lib/python3.6/site-packages

See: https://docs.brew.sh/Homebrew-and-Python

Unversioned symlinks python, python-config, pip etc. pointing to python3,
python3-config, pip3 etc., respectively, have been installed.

If you need Homebrew's Python 2, `brew install python@2`.
==> Summary
🍺  /usr/local/Cellar/python/3.6.4_3: 3,615 files, 56.3MB
```
so what's going on - have we clobbered python.org's Python 3?

```
$ python3
Python 3.6.4 (v3.6.4:d48ecebad5, Dec 18 2017, 21:07:28) 
[GCC 4.2.1 (Apple Inc. build 5666) (dot 3)] on darwin

$ /usr/local/Cellar/python/3.6.4_3/bin/python3
Python 3.6.4 (default, Mar  1 2018, 18:36:42) 
[GCC 4.2.1 Compatible Apple LLVM 9.0.0 (clang-900.0.39.2)] on darwin
```

looks like the brew version is separate, though there are some potential conflicts being listed by the brew installer. Hmmm.  Let's looks at what pipfix says:

```
> node pipfix.js

pipfix is analysing...
/usr/bin/python ---------- Object {
  "is_default": true,
  "path": "/usr/bin/python",
  "pip": Object {
    "installed": true,
    "site": "/Library/Python/2.7/site-packages",
    "version": "9.0.1",
  },
  "runs_ok": true,
  "sys.path": "13 entries",
  "version": "2.7.10",
}
/usr/local/bin/python3 ---------- Object {
  "is_default": false,
  "path": "/usr/local/bin/python3",
  "pip": Object {
    "installed": true,
    "site": "/Library/Frameworks/Python.framework/Versions/3.6/lib/python3.6/site-packages",
    "version": "9.0.1",
  },
  "runs_ok": true,
  "sys.path": "5 entries",
  "version": "3.6.4",
}
/usr/local/Cellar/python/3.6.4_3/bin/python3 ---------- Object {
  "is_default": false,
  "path": "/usr/local/Cellar/python/3.6.4_3/bin/python3",
  "pip": Object {
    "installed": true,
    "site": "/usr/local/lib/python3.6/site-packages",
    "version": "9.0.1",
  },
  "runs_ok": true,
  "sys.path": "6 entries",
  "version": "3.6.4",
}
/usr/local/bin/pip ---------- Object {
  "is_default": true,
  "path": "/usr/local/bin/pip",
  "runs_ok": true,
  "site": "/usr/local/lib/python3.6/site-packages",
  "site_relationships": Object {
    "/usr/bin/python": false,
    "/usr/local/Cellar/python/3.6.4_3/bin/python3": true,
    "/usr/local/bin/python3": false,
  },
  "version": "9.0.1",
}
/usr/local/bin/pip3 ---------- Object {
  "is_default": false,
  "path": "/usr/local/bin/pip3",
  "runs_ok": true,
  "site": "/usr/local/lib/python3.6/site-packages",
  "site_relationships": Object {
    "/usr/bin/python": false,
    "/usr/local/Cellar/python/3.6.4_3/bin/python3": true,
    "/usr/local/bin/python3": false,
  },
  "version": "9.0.1",
}
/usr/local/Cellar/python/3.6.4_3/bin/pip3 ---------- Object {
  "is_default": false,
  "path": "/usr/local/Cellar/python/3.6.4_3/bin/pip3",
  "runs_ok": true,
  "site": "/usr/local/lib/python3.6/site-packages",
  "site_relationships": Object {
    "/usr/bin/python": false,
    "/usr/local/Cellar/python/3.6.4_3/bin/python3": true,
    "/usr/local/bin/python3": false,
  },
  "version": "9.0.1",
}

Recommendations (3 pythons found, 3 pips found)
---------------
/usr/bin/python
   - ok

/usr/local/bin/python3
   - ok

/usr/local/Cellar/python/3.6.4_3/bin/python3
   - ok

/usr/local/bin/pip
   - ok

/usr/local/bin/pip3
   - ok

/usr/local/Cellar/python/3.6.4_3/bin/pip3
   - ok
```

Looking at the pure Python information

```
Python 3 from python.org lives in /usr/local/bin/python3 and its pip uses
    "site": "/Library/Frameworks/Python.framework/Versions/3.6/lib/python3.6/site-packages",
Python 3 from brew lives in /usr/local/Cellar/python/3.6.4_3/bin/python3 and its pip uses
    "site": "/usr/local/lib/python3.6/site-packages",
```

we can clearly see that brew is using a different site_packages location than python.org Python - which is good.  But let's look at the pip3 invocations, because they seem to tell a different story:

```
/usr/local/bin/pip3
  "site": "/usr/local/lib/python3.6/site-packages",

/usr/local/Cellar/python/3.6.4_3/bin/pip3
  "site": "/usr/local/lib/python3.6/site-packages",  
```

thus it looks like pip3 from brew has taken over?   Yet ironically, invoking `pip3` gives us the python.org pip3 version"

```
$ which pip3
/Library/Frameworks/Python.framework/Versions/3.6/bin/pip3
```

This is because of the PATH and python.org has put its stuff first:

```
Andys-Mac:pipfix andy$ echo $PATH
/Library/Frameworks/Python.framework/Versions/3.6/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
```

Gosh.  How confusing.  This is why I built `pipfix` so that we can investigate and look at this stuff!  Invoking `/usr/local/bin/python3` gives us python.org Python

```
Andys-Mac:pipfix andy$ /usr/local/bin/python3
Python 3.6.4 (v3.6.4:d48ecebad5, Dec 18 2017, 21:07:28) 
[GCC 4.2.1 (Apple Inc. build 5666) (dot 3)] on darwin
Type "help", "copyright", "credits" or "license" for more information.

>>> ^D
Andys-Mac:pipfix andy$ /Library/Frameworks/Python.framework/Versions/3.6/bin/python3
Python 3.6.4 (v3.6.4:d48ecebad5, Dec 18 2017, 21:07:28) 
[GCC 4.2.1 (Apple Inc. build 5666) (dot 3)] on darwin
Type "help", "copyright", "credits" or "license" for more information.
>>> ^D
```

It looks like unless we fiddle with the PATH, to get brew's pip3 and python3 we need to invoke the brew 'cellar' version of Python directly

```
Andys-Mac:pipfix andy$ /usr/local/Cellar/python/3.6.4_3/bin/python3
Python 3.6.4 (default, Mar  1 2018, 18:36:42) 
[GCC 4.2.1 Compatible Apple LLVM 9.0.0 (clang-900.0.39.2)] on darwin
Type "help", "copyright", "credits" or "license" for more information.
>>> 


$ /usr/local/Cellar/python/3.6.4_3/bin/pip3 install -r requirements.txt

```

etc.

The caching seems compatible, and site packages that were installed for python.org Python 3 install almost instantly for brew Python 3 - which is nice.

## Can you have Python 3 from python.prg, anaconda and brew installed at the same time?

Looks like you can.

- Python.org python installs itself in /usr/local/bin/ (site packages go in /Library/Frameworks/Python.framework/Versions/3.6/lib/python3.6/site-packages) as a 'framework python' (which is what e.g. wxpython needs, and thus what packages like gooey UI builder need)
- Brew python installs itself into /usr/local/Cellar/python/... (site packages go in /usr/local/lib/python3.6/site-packages) 
- Anaconda / Miniconda installs itself wherever you specify and has local version of sitepackages, too.

Invoke with `python3` and use the PATH to put the one you want first.  Or invoke with a full path.  Same with the corresponding `pip3` invocations.

### Update

Looking more closely at pipfix output, it looks like brew Python 3 just clobbered `/usr/loca/bin/pip` which we installed to service the default built in Mac framework Python:

```
...
/usr/local/bin/pip ---------- Object {
  "is_default": true,
  "path": "/usr/local/bin/pip",
  "runs_ok": true,
  "site": "/usr/local/lib/python3.6/site-packages",
  "site_relationships": Object {
    "/usr/bin/python": false,
    "/usr/local/Cellar/python/3.6.4_3/bin/python3": true,
    "/usr/local/bin/python3": false,
  },
  "version": "9.0.1",
}
/usr/local/bin/pip2 ---------- Object {
  "is_default": false,
  "path": "/usr/local/bin/pip2",
  "runs_ok": true,
  "site": "/Library/Python/2.7/site-packages",
  "site_relationships": Object {
    "/usr/bin/python": true,
    "/usr/local/Cellar/python/3.6.4_3/bin/python3": false,
    "/usr/local/bin/python3": false,
  },
  "version": "9.0.1",
}
...
```

compare this with what `/usr/loca/bin/pip` used to be

```
/usr/local/bin/pip ---------- Object {
  "is_default": true,
  "path": "/usr/local/bin/pip",
  "runs_ok": true,
  "site": "/Library/Python/2.7/site-packages",
  "site_relationships": Object {
    "/usr/bin/python": true,
  },
  "version": "9.0.1",
}
```

`/usr/loca/bin/pip` used to point to system Python 2, now it points to brew Python 3.
To 'fix' this situation we can invoke system pip using python itself:

```
/usr/bin/python -m pip -V
pip 9.0.1 from /Library/Python/2.7/site-packages/pip-9.0.1-py2.7.egg (python 2.7)
```

or remember all the places our initial pip was installed to?  Here is a reminder:

```
...
creating /Library/Python/2.7/site-packages/pip-9.0.1-py2.7.egg
Extracting pip-9.0.1-py2.7.egg to /Library/Python/2.7/site-packages
Adding pip 9.0.1 to easy-install.pth file
Installing pip script to /usr/local/bin
Installing pip2.7 script to /usr/local/bin
Installing pip2 script to /usr/local/bin

Installed /Library/Python/2.7/site-packages/pip-9.0.1-py2.7.egg
Processing dependencies for pip
Finished processing dependencies for pip
```

thus we can simply invoke `pip2.7` or `pip2`

```
$ pip2.7 -V
pip 9.0.1 from /Library/Python/2.7/site-packages/pip-9.0.1-py2.7.egg (python 2.7)

$ pip2 -V
pip 9.0.1 from /Library/Python/2.7/site-packages/pip-9.0.1-py2.7.egg (python 2.7)

```

### /usr/local/bin/pip3 clobbered too

And it also seems that `/usr/local/bin/pip3` has been clobbered by brew's pip3.  We can see this from the visualisation

![visualisation of pipfix results](../images/graph01.png "visualisation of which pip points to which python")

Notice there is no pip pointing to `/usr/local/bin/pip3` anymore.

Yikes!  Of course you can still invoke pip via the `/usr/local/bin/python -m pip` technique.  Pipfix is evolving to find any other pips or hardlinks to pips that may be lying around, stay tuned...

## Let's add brew Python 2

This will mean we have two brew Python installations (Python 2 and Python 3), as well as the default Mac Python 2 and python.org Python 3.

```
Andys-Mac:pipfix andy$ brew install python2
Updating Homebrew...
==> Auto-updated Homebrew!
Updated 1 tap (homebrew/core).
==> Updated Formulae
glade           gsoap           imagemagick     imagemagick@6   mutt            offlineimap     pre-commit      sip

==> Downloading https://homebrew.bintray.com/bottles/python@2-2.7.14_1.sierra.bottle.tar.gz
######################################################################## 100.0%
==> Pouring python@2-2.7.14_1.sierra.bottle.tar.gz
==> /usr/local/Cellar/python@2/2.7.14_1/bin/python2 -s setup.py --no-user-cfg install --force --verbose --single-version-exter
==> /usr/local/Cellar/python@2/2.7.14_1/bin/python2 -s setup.py --no-user-cfg install --force --verbose --single-version-exter
==> /usr/local/Cellar/python@2/2.7.14_1/bin/python2 -s setup.py --no-user-cfg install --force --verbose --single-version-exter
==> Caveats
This formula installs a python2 executable to /usr/local/opt/python@2/bin
If you wish to have this formula's python executable in your PATH then add
the following to ~/.bash_profile:
  export PATH="/usr/local/opt/python@2/libexec/bin:$PATH"

Pip and setuptools have been installed. To update them
  pip2 install --upgrade pip setuptools

You can install Python packages with
  pip2 install <package>

They will install into the site-package directory
  /usr/local/lib/python2.7/site-packages

See: https://docs.brew.sh/Homebrew-and-Python

This formula is keg-only, which means it was not symlinked into /usr/local,
because this is an alternate version of another formula.

If you need to have this software first in your PATH run:
  echo 'export PATH="/usr/local/opt/python@2/bin:$PATH"' >> ~/.bash_profile
```

Let's see what pipfix makes of this this:

```
$ npm start

> pipfix@1.0.0 start /Users/andy/pipfix
> node pipfix.js

pipfix is analysing...
/usr/bin/python ---------- Object {
  "is_default": true,
  "path": "/usr/bin/python",
  "pip": Object {
    "installed": true,
    "site": "/Library/Python/2.7/site-packages",
    "version": "9.0.1",
  },
  "runs_ok": true,
  "sys.path": "13 entries",
  "version": "2.7.10",
}
/usr/local/bin/python3 ---------- Object {
  "is_default": false,
  "path": "/usr/local/bin/python3",
  "pip": Object {
    "installed": true,
    "site": "/Library/Frameworks/Python.framework/Versions/3.6/lib/python3.6/site-packages",
    "version": "9.0.1",
  },
  "runs_ok": true,
  "sys.path": "5 entries",
  "version": "3.6.4",
}
/usr/local/Cellar/python@2/2.7.14_1/bin/python2 ---------- Object {
  "is_default": false,
  "path": "/usr/local/Cellar/python@2/2.7.14_1/bin/python2",
  "pip": Object {
    "installed": true,
    "site": "/usr/local/lib/python2.7/site-packages",
    "version": "9.0.1",
  },
  "runs_ok": true,
  "sys.path": "11 entries",
  "version": "2.7.14",
}
/usr/local/Cellar/python/3.6.4_3/bin/python3 ---------- Object {
  "is_default": false,
  "path": "/usr/local/Cellar/python/3.6.4_3/bin/python3",
  "pip": Object {
    "installed": true,
    "site": "/usr/local/lib/python3.6/site-packages",
    "version": "9.0.1",
  },
  "runs_ok": true,
  "sys.path": "6 entries",
  "version": "3.6.4",
}
/usr/local/bin/pip ---------- Object {
  "is_default": true,
  "path": "/usr/local/bin/pip",
  "runs_ok": true,
  "site": "/usr/local/lib/python3.6/site-packages",
  "site_relationships": Object {
    "/usr/bin/python": false,
    "/usr/local/Cellar/python/3.6.4_3/bin/python3": true,
    "/usr/local/Cellar/python@2/2.7.14_1/bin/python2": false,
    "/usr/local/bin/python3": false,
  },
  "version": "9.0.1",
}
/usr/local/bin/pip2 ---------- Object {
  "is_default": false,
  "path": "/usr/local/bin/pip2",
  "runs_ok": true,
  "site": "/Library/Python/2.7/site-packages",
  "site_relationships": Object {
    "/usr/bin/python": true,
    "/usr/local/Cellar/python/3.6.4_3/bin/python3": false,
    "/usr/local/Cellar/python@2/2.7.14_1/bin/python2": false,
    "/usr/local/bin/python3": false,
  },
  "version": "9.0.1",
}
/usr/local/bin/pip3 ---------- Object {
  "is_default": false,
  "path": "/usr/local/bin/pip3",
  "runs_ok": true,
  "site": "/usr/local/lib/python3.6/site-packages",
  "site_relationships": Object {
    "/usr/bin/python": false,
    "/usr/local/Cellar/python/3.6.4_3/bin/python3": true,
    "/usr/local/Cellar/python@2/2.7.14_1/bin/python2": false,
    "/usr/local/bin/python3": false,
  },
  "version": "9.0.1",
}
/usr/local/Cellar/python@2/2.7.14_1/bin/pip2 ---------- Object {
  "is_default": false,
  "path": "/usr/local/Cellar/python@2/2.7.14_1/bin/pip2",
  "runs_ok": true,
  "site": "/usr/local/lib/python2.7/site-packages",
  "site_relationships": Object {
    "/usr/bin/python": false,
    "/usr/local/Cellar/python/3.6.4_3/bin/python3": false,
    "/usr/local/Cellar/python@2/2.7.14_1/bin/python2": true,
    "/usr/local/bin/python3": false,
  },
  "version": "9.0.1",
}
/usr/local/Cellar/python/3.6.4_3/bin/pip3 ---------- Object {
  "is_default": false,
  "path": "/usr/local/Cellar/python/3.6.4_3/bin/pip3",
  "runs_ok": true,
  "site": "/usr/local/lib/python3.6/site-packages",
  "site_relationships": Object {
    "/usr/bin/python": false,
    "/usr/local/Cellar/python/3.6.4_3/bin/python3": true,
    "/usr/local/Cellar/python@2/2.7.14_1/bin/python2": false,
    "/usr/local/bin/python3": false,
  },
  "version": "9.0.1",
}

Recommendations (4 pythons found, 5 pips found)
---------------
/usr/bin/python
   - ok

/usr/local/bin/python3
   - ok

/usr/local/Cellar/python@2/2.7.14_1/bin/python2
   - ok

/usr/local/Cellar/python/3.6.4_3/bin/python3
   - ok

/usr/local/bin/pip
   - ok

/usr/local/bin/pip2
   - ok

/usr/local/bin/pip3
   - ok

/usr/local/Cellar/python@2/2.7.14_1/bin/pip2
   - ok

/usr/local/Cellar/python/3.6.4_3/bin/pip3
   - ok

```

we invoke this brew Python2 with

```
$ /usr/local/Cellar/python@2/2.7.14_1/bin/python2 -V
Python 2.7.14
```

# Lots of python bits

TODO - need to list all the Python and pip hard links and amalgamate information about which are different ways of invoking the same Python etc.  e.g.

```
Andys-Mac:pipfix andy$ ls -l /usr/bin/python*
-rwxr-xr-x  1 root  wheel  66576 15 Jul  2017 /usr/bin/python
-rwxr-xr-x  5 root  wheel    925  7 Feb  2017 /usr/bin/python-config
lrwxr-xr-x  1 root  wheel     75  3 Mar 10:04 /usr/bin/python2.6 -> ../../System/Library/Frameworks/Python.framework/Versions/2.6/bin/python2.6
lrwxr-xr-x  1 root  wheel     82  3 Mar 10:04 /usr/bin/python2.6-config -> ../../System/Library/Frameworks/Python.framework/Versions/2.6/bin/python2.6-config
lrwxr-xr-x  1 root  wheel     75  3 Mar 10:04 /usr/bin/python2.7 -> ../../System/Library/Frameworks/Python.framework/Versions/2.7/bin/python2.7
lrwxr-xr-x  1 root  wheel     82  3 Mar 10:04 /usr/bin/python2.7-config -> ../../System/Library/Frameworks/Python.framework/Versions/2.7/bin/python2.7-config
-rwxr-xr-x  1 root  wheel  66576 15 Jul  2017 /usr/bin/pythonw
lrwxr-xr-x  1 root  wheel     76  3 Mar 10:04 /usr/bin/pythonw2.6 -> ../../System/Library/Frameworks/Python.framework/Versions/2.6/bin/pythonw2.6
lrwxr-xr-x  1 root  wheel     76  3 Mar 10:04 /usr/bin/pythonw2.7 -> ../../System/Library/Frameworks/Python.framework/Versions/2.7/bin/pythonw2.7
Andys-Mac:pipfix andy$ ls -l /usr/local/bin/python*
-rwxr-xr-x  1 andy  admin  2574  4 Mar 21:54 /usr/local/bin/python-argcomplete-check-easy-install-script
-rwxr-xr-x  1 andy  admin   314  4 Mar 21:54 /usr/local/bin/python-argcomplete-tcsh
-rwxr-xr-x  1 andy  admin   232  4 Mar 21:54 /usr/local/bin/python-escpos
lrwxr-xr-x  1 root  wheel    69  3 Mar 17:21 /usr/local/bin/python3 -> ../../../Library/Frameworks/Python.framework/Versions/3.6/bin/python3
lrwxr-xr-x  1 root  wheel    72  3 Mar 17:21 /usr/local/bin/python3-32 -> ../../../Library/Frameworks/Python.framework/Versions/3.6/bin/python3-32
lrwxr-xr-x  1 root  wheel    76  3 Mar 17:21 /usr/local/bin/python3-config -> ../../../Library/Frameworks/Python.framework/Versions/3.6/bin/python3-config
lrwxr-xr-x  1 root  wheel    71  3 Mar 17:21 /usr/local/bin/python3.6 -> ../../../Library/Frameworks/Python.framework/Versions/3.6/bin/python3.6
lrwxr-xr-x  1 root  wheel    74  3 Mar 17:21 /usr/local/bin/python3.6-32 -> ../../../Library/Frameworks/Python.framework/Versions/3.6/bin/python3.6-32
lrwxr-xr-x  1 root  wheel    78  3 Mar 17:21 /usr/local/bin/python3.6-config -> ../../../Library/Frameworks/Python.framework/Versions/3.6/bin/python3.6-config
lrwxr-xr-x  1 root  wheel    72  3 Mar 17:21 /usr/local/bin/python3.6m -> ../../../Library/Frameworks/Python.framework/Versions/3.6/bin/python3.6m
lrwxr-xr-x  1 root  wheel    79  3 Mar 17:21 /usr/local/bin/python3.6m-config -> ../../../Library/Frameworks/Python.framework/Versions/3.6/bin/python3.6m-config
Andys-Mac:pipfix andy$
```

Lots of juicy information here. Notice there is a 'System' Python 2.6 as well as a Python 2.7.  Pipfix should be finding stuff like this.  For example is there a pip for Python 2.6? We can find out manually that there isn't a pip for Python 2.6 e.g.

```
$ python2.6 -m pip -V
/usr/bin/python2.6: No module named pip

$ python2.7 -m pip -V
pip 9.0.1 from /Library/Python/2.7/site-packages/pip-9.0.1-py2.7.egg (python 2.7)
```

Note, Python 2.6 has been removed from the later High Sierra.  I am testing on Sierra.

