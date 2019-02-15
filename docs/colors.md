where do colors come from?
==========================

a node needs a color

some nodes can provide their own color
other nodes should get it from an ancestor/upstream

connections need color
connections get it from the source node or the source nodes ancestors

# Options
- compute color in selectors
- store all colors in state
	- each node and connection will store its color in its state
	- how to update a downstream node's color when changing an upstream connection?
	- recompute all colors in the entire graph?
	- **recompute colors downstream**
	- need middleware to do it
		- ⭐️middleware will allow async computing in the future

# Recomputing Colors in Middleware
When a connection changes
The middleware will trace the graph downstream from that connection
	and dispatch color updates for all necessary items

What do if downstream item has multiple incoming connections?

