let vis = require("vis")

// provide data in the DOT language

// var DOTstring = 'dinetwork {1 -> 1 -> 2; 2 -> 3; 2 -- 4; 2 -> 1 }';
var DOTstring = `
digraph G {
  "/Library/Python/2.7/site-packages" [shape=box];
  "/Users/Andy/miniconda/envs/py36/lib/python3.6/site-packages" [shape=box];
  "/Users/Andy/miniconda/lib/python2.7/site-packages" [shape=box];
  "/Users/Andy/miniconda/envs/py36/lib/python3.6/site-packages" [shape=box];
  "/Users/Andy/miniconda/envs/py27/lib/python2.7/site-packages" [shape=box];
  "/Users/Andy/miniconda/envs/py27/lib/python2.7/site-packages" [shape=box];
  "/Users/Andy/miniconda/envs/py2k/lib/python2.7/site-packages" [shape=box];
  "/Users/Andy/miniconda/envs/py2k/lib/python2.7/site-packages" [shape=box];
  "/Users/Andy/miniconda/envs/py2kosqa/lib/python2.7/site-packages" [shape=box];
  "/Users/Andy/miniconda/envs/py2kosqa/lib/python2.7/site-packages" [shape=box];
  "/Users/Andy/miniconda/envs/py34k/lib/python3.4/site-packages" [shape=box];
  "/Users/Andy/miniconda/envs/py34k/lib/python3.4/site-packages" [shape=box];
  "/Users/Andy/miniconda/envs/py36/lib/python3.6/site-packages" [shape=box];
  "/Users/Andy/miniconda/envs/py36/lib/python3.6/site-packages" [shape=box];
  "/Users/Andy/miniconda/envs/py3ch2/lib/python3.4/site-packages" [shape=box];
  "/Users/Andy/miniconda/envs/py3ch2/lib/python3.4/site-packages" [shape=box];
  "/Users/Andy/miniconda/envs/ultimate_django_2/lib/python2.7/site-packages" [shape=box];
  "/Users/Andy/miniconda/envs/ultimate_django_2/lib/python2.7/site-packages" [shape=box];
  "/Library/Python/2.7/site-packages" [shape=box];
  "/Library/Python/2.7/site-packages" [shape=box];
  "/Users/Andy/miniconda/envs/py36/lib/python3.6/site-packages" [shape=box];
  "/Users/Andy/miniconda/envs/py27/lib/python2.7/site-packages" [shape=box];
  "/Users/Andy/miniconda/envs/py2k/lib/python2.7/site-packages" [shape=box];
  "/Users/Andy/miniconda/envs/py2kosqa/lib/python2.7/site-packages" [shape=box];
  "/Users/Andy/miniconda/envs/py34k/lib/python3.4/site-packages" [shape=box];
  "/Users/Andy/miniconda/envs/py36/lib/python3.6/site-packages" [shape=box];
  "/Users/Andy/miniconda/envs/py3ch2/lib/python3.4/site-packages" [shape=box];
  "/Users/Andy/miniconda/envs/ultimate_django_2/lib/python2.7/site-packages" [shape=box];

  "/usr/bin/python" -> "/Library/Python/2.7/site-packages" [style=dotted];
  "/Users/Andy/miniconda/envs/py36/bin/python" -> "/Users/Andy/miniconda/envs/py36/lib/python3.6/site-packages" [style=dotted];
  "/Users/Andy/miniconda/bin/python2" -> "/Users/Andy/miniconda/lib/python2.7/site-packages" [style=dotted];
  "/Users/Andy/miniconda/envs/py36/bin/python3" -> "/Users/Andy/miniconda/envs/py36/lib/python3.6/site-packages" [style=dotted];
  "/Users/Andy/miniconda/envs/py27/bin/python" -> "/Users/Andy/miniconda/envs/py27/lib/python2.7/site-packages" [style=dotted];
  "/Users/Andy/miniconda/envs/py27/bin/python2" -> "/Users/Andy/miniconda/envs/py27/lib/python2.7/site-packages" [style=dotted];
  "/Users/Andy/miniconda/envs/py2k/bin/python" -> "/Users/Andy/miniconda/envs/py2k/lib/python2.7/site-packages" [style=dotted];
  "/Users/Andy/miniconda/envs/py2k/bin/python2" -> "/Users/Andy/miniconda/envs/py2k/lib/python2.7/site-packages" [style=dotted];
  "/Users/Andy/miniconda/envs/py2kosqa/bin/python" -> "/Users/Andy/miniconda/envs/py2kosqa/lib/python2.7/site-packages" [style=dotted];
  "/Users/Andy/miniconda/envs/py2kosqa/bin/python2" -> "/Users/Andy/miniconda/envs/py2kosqa/lib/python2.7/site-packages" [style=dotted];
  "/Users/Andy/miniconda/envs/py34k/bin/python" -> "/Users/Andy/miniconda/envs/py34k/lib/python3.4/site-packages" [style=dotted];
  "/Users/Andy/miniconda/envs/py34k/bin/python3" -> "/Users/Andy/miniconda/envs/py34k/lib/python3.4/site-packages" [style=dotted];
  "/Users/Andy/miniconda/envs/py36/bin/python" -> "/Users/Andy/miniconda/envs/py36/lib/python3.6/site-packages" [style=dotted];
  "/Users/Andy/miniconda/envs/py36/bin/python3" -> "/Users/Andy/miniconda/envs/py36/lib/python3.6/site-packages" [style=dotted];
  "/Users/Andy/miniconda/envs/py3ch2/bin/python" -> "/Users/Andy/miniconda/envs/py3ch2/lib/python3.4/site-packages" [style=dotted];
  "/Users/Andy/miniconda/envs/py3ch2/bin/python3" -> "/Users/Andy/miniconda/envs/py3ch2/lib/python3.4/site-packages" [style=dotted];
  "/Users/Andy/miniconda/envs/ultimate_django_2/bin/python" -> "/Users/Andy/miniconda/envs/ultimate_django_2/lib/python2.7/site-packages" [style=dotted];
  "/Users/Andy/miniconda/envs/ultimate_django_2/bin/python2" -> "/Users/Andy/miniconda/envs/ultimate_django_2/lib/python2.7/site-packages" [style=dotted];
  "/usr/local/bin/pip" -> "/Library/Python/2.7/site-packages" [style=dotted];
  "/usr/local/bin/pip" -> "/usr/bin/python" [color=blue];
  "/usr/local/bin/pip2" -> "/Library/Python/2.7/site-packages" [style=dotted];
  "/usr/local/bin/pip2" -> "/usr/bin/python" [color=blue];
  "/Users/Andy/miniconda/envs/py36/bin/pip" -> "/Users/Andy/miniconda/envs/py36/lib/python3.6/site-packages" [style=dotted];
  "/Users/Andy/miniconda/envs/py36/bin/pip" -> "/Users/Andy/miniconda/envs/py36/bin/python" [color=blue];
  "/Users/Andy/miniconda/envs/py36/bin/pip" -> "/Users/Andy/miniconda/envs/py36/bin/python3" [color=blue];
  "/Users/Andy/miniconda/envs/py27/bin/pip" -> "/Users/Andy/miniconda/envs/py27/lib/python2.7/site-packages" [style=dotted];
  "/Users/Andy/miniconda/envs/py27/bin/pip" -> "/Users/Andy/miniconda/envs/py27/bin/python" [color=blue];
  "/Users/Andy/miniconda/envs/py27/bin/pip" -> "/Users/Andy/miniconda/envs/py27/bin/python2" [color=blue];
  "/Users/Andy/miniconda/envs/py2k/bin/pip" -> "/Users/Andy/miniconda/envs/py2k/lib/python2.7/site-packages" [style=dotted];
  "/Users/Andy/miniconda/envs/py2k/bin/pip" -> "/Users/Andy/miniconda/envs/py2k/bin/python" [color=blue];
  "/Users/Andy/miniconda/envs/py2k/bin/pip" -> "/Users/Andy/miniconda/envs/py2k/bin/python2" [color=blue];
  "/Users/Andy/miniconda/envs/py2kosqa/bin/pip" -> "/Users/Andy/miniconda/envs/py2kosqa/lib/python2.7/site-packages" [style=dotted];
  "/Users/Andy/miniconda/envs/py2kosqa/bin/pip" -> "/Users/Andy/miniconda/envs/py2kosqa/bin/python" [color=blue];
  "/Users/Andy/miniconda/envs/py2kosqa/bin/pip" -> "/Users/Andy/miniconda/envs/py2kosqa/bin/python2" [color=blue];
  "/Users/Andy/miniconda/envs/py34k/bin/pip" -> "/Users/Andy/miniconda/envs/py34k/lib/python3.4/site-packages" [style=dotted];
  "/Users/Andy/miniconda/envs/py34k/bin/pip" -> "/Users/Andy/miniconda/envs/py34k/bin/python" [color=blue];
  "/Users/Andy/miniconda/envs/py34k/bin/pip" -> "/Users/Andy/miniconda/envs/py34k/bin/python3" [color=blue];
  "/Users/Andy/miniconda/envs/py36/bin/pip" -> "/Users/Andy/miniconda/envs/py36/lib/python3.6/site-packages" [style=dotted];
  "/Users/Andy/miniconda/envs/py36/bin/pip" -> "/Users/Andy/miniconda/envs/py36/bin/python" [color=blue];
  "/Users/Andy/miniconda/envs/py36/bin/pip" -> "/Users/Andy/miniconda/envs/py36/bin/python3" [color=blue];
  "/Users/Andy/miniconda/envs/py3ch2/bin/pip" -> "/Users/Andy/miniconda/envs/py3ch2/lib/python3.4/site-packages" [style=dotted];
  "/Users/Andy/miniconda/envs/py3ch2/bin/pip" -> "/Users/Andy/miniconda/envs/py3ch2/bin/python" [color=blue];
  "/Users/Andy/miniconda/envs/py3ch2/bin/pip" -> "/Users/Andy/miniconda/envs/py3ch2/bin/python3" [color=blue];
  "/Users/Andy/miniconda/envs/ultimate_django_2/bin/pip" -> "/Users/Andy/miniconda/envs/ultimate_django_2/lib/python2.7/site-packages" [style=dotted];
  "/Users/Andy/miniconda/envs/ultimate_django_2/bin/pip" -> "/Users/Andy/miniconda/envs/ultimate_django_2/bin/python" [color=blue];
  "/Users/Andy/miniconda/envs/ultimate_django_2/bin/pip" -> "/Users/Andy/miniconda/envs/ultimate_django_2/bin/python2" [color=blue];

}
`


var parsedData = vis.network.convertDot(DOTstring);

var data = {
  nodes: parsedData.nodes,
  edges: parsedData.edges
}

var options = parsedData.options;

// you can extend the options like a normal JSON variable:
options.nodes = {
  color: 'red'
}

// create a network
// var network = new vis.Network(container, data, options);
console.log(data)

