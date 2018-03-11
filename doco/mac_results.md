# Scenario Testing

The plan here is to document what happens when  you install the various Pythons on a Mac, in most combinations. And noting what happens and what gets clobbered.

We would note:
- what happens to the PATH
- what is the python that gets invoked when you type `python`
- which `pip` is invoked when you type pip
- similarly for python2, python3, pip2, pip3 invocations
- are there any clashes or problems

## Scenarios

All these installation scenarios would be nice to document using `pipfix`

Pipfix looks at the environment it is launched from, so by activating a virtual environment or changing $PATH, you will get a different results.

### Simple scenarios

- clean mac
- clean mac + brew install pip
- clean mac + brew install python2
- clean mac + brew install python3
- clean mac + python.org python2 installer
- clean mac + python.org python3 installer
- clean mac + anaconda python2
- clean mac + anaconda python3
- clean mac + anaconda python2 + conda create python3 environment and activate it

### Mixing python versions from the same distribution

- clean mac + brew install python2 + brew install python3
- clean mac + install python.org python2 + install python.org python3

### Mixing distributions 

- Python 2 versions
    - clean mac + brew install python2 + python.org python2 installer
    - clean mac + python.org python2 installer + brew install python2
- Python 3 versions
    - clean mac + brew install python3 + python.org python3 installer
    - clean mac + python.org python3 installer + brew install python3
- Mixing Python 2 and Python 3 versions
    - clean mac + brew install python2 + python.org python3 installer
    - clean mac + brew install python3 + python.org python2 installer
    - clean mac + python.org python2 installer + brew install python3
    - clean mac + python.org python3 installer + brew install python2

### All you can eat - multiple installations from multiple distributions

- clean mac + brew install python2 + brew install python3 + python.org python2 installer + python.org python3 installer

There are 24 permutations of the above scenario, depending on the order you install things. If we further add an initial  `brew install pip` into the above scenarios, the number of perumations increases depending on how many are done.  For example imagine running `brew install pip` after each python installation:

- clean mac + brew install pip + brew install python2 + brew install pip + brew install python3 + brew install pip + python.org python2 installer + brew install pip + python.org python3 installer + brew install pip

Yes its a contrived example and perhaps a rule will establish itself which avoids the need to test such scenarios.

## Even more scenarios

### Anaconda

And we haven't explored the scenarios resulting from:

- multiple anaconda installations
- mixed miniconda + anaconda installations
- conda installation vs. conda virtual environments
- conda packages mixed with pip packages for the default conda install
- conda packages mixed with pip packages for a conda virtual environment
- using traditional virtualenv in a conda environment
- using traditional virtualenv in a conda virtual environment

Anaconda installations are more insulated than most - for example deleting a miniconda directory will blow away all of miniconda. Thus most miniconda/anaconda scenario testing might be more about managing your $PATH and what conda environment you have active.  There are however many questions raised by the above list of scenarios.

### Virtual environments and other factors

Then there are even more scenarious offered by:

- multiple traditional virtual environments
- pipenv
- other types of python installations (pipi?)
- testing on multiple operating systems

## Conclusion

The number of scenarios is great, the permutations are huge.  This is too much for one person to test.  And when Pipfix gets updated with more intelligence, the tests would have to be re-run.

How to achieve the goal:
- A community driven database, people can contribute scenarios and the pipfix results
- An automated virtual machine crunching through all the possibilities?

