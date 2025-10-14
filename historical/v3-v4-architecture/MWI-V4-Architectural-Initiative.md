# MWI V4 Architectural Initiative

I feel like we might be at the point to "write off" MWI implementation 0.1.0 and start 0.2.0 (v4-level plans). Getting the current implementation to work properly seems excessively difficult.

While there are no "sacred cows", I want to make sure we're learning from, and leveraging, what we've built so far (you should consider everything we've created so far as essential context for this task).

In particular, we need to be careful about maintaining all current requirements (such as smart components have control over child content rendering) unless we're deliberately removing them from the new architecture (this goes back to "all existing architecture is context for this task").

I think we can and should make some simplifications through convention/interface definition, such as "a plain array/NANOS to be rendered shall always be construed as a document fragment" (i.e. any text at the top level is always destined to be a text node, never a tag name):

`[text [tag] text]`

Such approaches are simpler for the code, and easier to document/explain to users. We should mininize the "sometimes it's this, other times it's that" factor.

Does it make sense to keep the .outerHTML rendering path as a separate part of the rendering pipeline? (A getter obviously can't bring in any extra rendering context/state, for example.).

Can we achieve a cleaner, simpler, more `docData.map(input => output)`-style of architecture (only meant as an analogy; I'm **not** explicitly suggesting that we should name any particular part of the rendering pipeline `map`)?

I think we need to be smarter about the rendering flow. Perhaps, *if necessary*:
- Nodes maintain status reflecting whether any additional (child-)rendering is needed.
- Non-node content gets converted to a node, so that it can be processed in an informed manner.

If we agree this justifies a new architecture and not "minor adjustments" to the existing one, new architectural plan file names should start with MWI-V4.

Please do a "deep dive" into ways that we could create a simple, cleaner, more robust architecture and any design alternatives we should consider.