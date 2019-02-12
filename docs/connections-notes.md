creating connections from nodes that dont have any connections

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
