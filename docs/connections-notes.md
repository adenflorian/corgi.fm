creating connections from nodes that don't have any connections

visual connections are currently handled by ConnectionView component

One ConnectionView is rendered for each connection in state

The problem here is that if a node has no connections, then this component won't render for it

options:
- make ConnectionView render on components regardless if there is actually a connection there or not
- split ConnectionView into different components for the connectors and the connection line

facts:
- all connections are connected to some node
	- its not possible to have a connection that isn't connected to anything
	- using this, instead of rendering based off of connections state,
		we could render connections by the node states


When user moves mouse next to empty connection point
Then show a ghost connector
When the user clicks and drags on that ghost connector
It behaves like a ghost connector for creating a new connection

who will render this ghost connector?
SimpleGraphNode?

# Colors and isActive

## How to determine color of a node
- If node state has its own color
- Then use that
- Else, combine colors of all incoming connections

## How to determine color of a connection
	- If source node state has its own color
	- Then use that
	- Else, combine colors of all incoming connections

## Should colors be lazily calculated or stored in state?
- If lazily calculated, then it gets complicated and perf issues
- If in state...when to calculate?
- When a node color changes or a connection changes (nodes cant change color at the moment)
- Where to store color state?
- Position state? (it's really generic node state at this point rather than just position data)
- Connections can still just get it from the source node

Middleware?
When

## PositionState
  - node id(s) of where color and isActive is coming from
  - colorSourceNodeIds: List<string>
  - isActiveSourceNodeIds: List<string>
