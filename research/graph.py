from graphviz import Digraph

# Create a directed graph
g = Digraph('G', filename='graph.gv', format='png')

# Add an edge between two nodes
# The nodes are created on the fly
g.edge('Hello', 'World')  

# Display the result
g.view()
# Render/save to disk
g.render()

