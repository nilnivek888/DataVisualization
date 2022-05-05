import * as d3 from "https://cdn.skypack.dev/d3@7";

// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/grouped-bar-chart
export function GroupedBarChart(
	data,
	{
		x = (d, i) => i, // given d in data, returns the (ordinal) x-value
		y = (d) => d, // given d in data, returns the (quantitative) y-value
		z = () => 1, // given d in data, returns the (categorical) z-value
		title, // given d in data, returns the title text
		marginTop = 30, // top margin, in pixels
		marginRight = 0, // right margin, in pixels
		marginBottom = 30, // bottom margin, in pixels
		marginLeft = 40, // left margin, in pixels
		width = 640, // outer width, in pixels
		height = 400, // outer height, in pixels
		xDomain, // array of x-values
		xRange = [marginLeft, width - marginRight], // [xmin, xmax]
		xPadding = 0.1, // amount of x-range to reserve to separate groups
		yType = d3.scaleLinear, // type of y-scale
		yDomain, // [ymin, ymax]
		yRange = [height - marginBottom, marginTop], // [ymin, ymax]
		zDomain, // array of z-values
		zPadding = 0.05, // amount of x-range to reserve to separate bars
		yFormat, // a format specifier string for the y-axis
		yLabel, // a label for the y-axis
		colors = d3.schemeTableau10, // array of colors
	} = {}
) {
	// Compute values.
	const X = d3.map(data, x);
	const Y = d3.map(data, y);
	const Z = d3.map(data, z);

	// Compute default domains, and unique the x- and z-domains.
	if (xDomain === undefined) xDomain = X;
	if (yDomain === undefined) yDomain = [0, d3.max(Y)];
	if (zDomain === undefined) zDomain = Z;
	xDomain = new d3.InternSet(xDomain);
	zDomain = new d3.InternSet(zDomain);

	// Omit any data not present in both the x- and z-domain.
	const I = d3
		.range(X.length)
		.filter((i) => xDomain.has(X[i]) && zDomain.has(Z[i]));

	// Construct scales, axes, and formats.
	const xScale = d3.scaleBand(xDomain, xRange).paddingInner(xPadding);
	const xzScale = d3
		.scaleBand(zDomain, [0, xScale.bandwidth()])
		.padding(zPadding);
	const yScale = yType(yDomain, yRange);
	const zScale = d3.scaleOrdinal(zDomain, colors);
	const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
	const yAxis = d3.axisLeft(yScale).ticks(height / 60, yFormat);

	// Compute titles.
	if (title === undefined) {
		const formatValue = yScale.tickFormat(100, yFormat);
		title = (i) => `${X[i]}\n${Z[i]}\n${formatValue(Y[i])}`;
	} else {
		const O = d3.map(data, (d) => d);
		const T = title;
		title = (i) => T(O[i], i, data);
	}

	const svg = d3
		.create("svg")
		.classed("container", true)
		.attr("width", width)
		.attr("height", height)
		.attr("viewBox", [0, 0, width, height])
		.attr("style", "max-width: 100%; height: auto; height: intrinsic;");

	svg.append("g")
		.attr("transform", `translate(${marginLeft},0)`)
		.call(yAxis)
		.call((g) => g.select(".domain").remove())
		.call((g) =>
			g
				.selectAll(".tick line")
				.clone()
				.attr("x2", width - marginLeft - marginRight)
				.attr("stroke-opacity", 0.1)
		)
		.call((g) =>
			g
				.append("text")
				.attr("x", -marginLeft)
				.attr("y", 10)
				.attr("fill", "currentColor")
				.attr("text-anchor", "start")
				.text(yLabel)
		);

	const bar = svg
		.append("g")
		.selectAll("rect")
		.data(I)
		.join("rect")
		.attr("x", (i) => xScale(X[i]) + xzScale(Z[i]))
		.attr("y", (i) => yScale(Y[i]))
		.attr("width", xzScale.bandwidth())
		.attr("height", (i) => yScale(0) - yScale(Y[i]))
		.attr("fill", (i) => zScale(Z[i]));

	if (title) bar.append("title").text(title);

	svg.append("g")
		.attr("transform", `translate(0,${height - marginBottom})`)
		.call(xAxis)
		.selectAll("text")
		.style("text-anchor", "end")
		.attr("dx", "-.8em")
		.attr("dy", ".15em")
		.attr("transform", "rotate(-65)"); // rotate text

	svg.append("g")
		.attr("transform", "translate(300,300)")
		.call((g) => {
			let height = 0;
			g.append("rect")
				.attr("width", "150")
				.attr("height", "50")
				.attr("style", "fill:white;stroke-width:1;stroke:black")
				.attr("transform", `translate(-25,-20)`);
			zDomain.forEach((zVal) => {
				g.append("rect")
					.attr("width", "10")
					.attr("height", "10")
					.attr("fill", `${zScale(zVal)}`)
					.attr("transform", `translate(-15,${height - 10})`);
				g.append("text")
					.attr("transform", `translate(0,${height})`)
					.text(zVal);
				height += 20;
			});
		});

	return Object.assign(svg.node());
}

// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/disjoint-force-directed-graph
export function ForceGraph(
	{
		nodes, // an iterable of node objects (typically [{id}, …])
		links, // an iterable of link objects (typically [{source, target}, …])
	},
	{
		nodeId = (d) => d.id, // given d in nodes, returns a unique identifier (string)
		nodeGroup, // given d in nodes, returns an (ordinal) value for color
		nodeGroups, // an array of ordinal values representing the node groups
		nodeTitle, // given d in nodes, a title string
		nodeFill = "currentColor", // node stroke fill (if not using a group color encoding)
		nodeStroke = "#fff", // node stroke color
		nodeStrokeWidth = 1.5, // node stroke width, in pixels
		nodeStrokeOpacity = 1, // node stroke opacity
		nodeRadius = 5, // node radius, in pixels
		nodeStrength,
		linkSource = ({ source }) => source, // given d in links, returns a node identifier string
		linkTarget = ({ target }) => target, // given d in links, returns a node identifier string
		linkStroke = "#999", // link stroke color
		linkStrokeOpacity = 0.6, // link stroke opacity
		linkStrokeWidth = 1.5, // given d in links, returns a stroke width in pixels
		linkStrokeLinecap = "round", // link stroke linecap
		linkStrength,
		colors = d3.schemeTableau10, // an array of color strings, for the node groups
		width = 640, // outer width, in pixels
		height = 400, // outer height, in pixels
		invalidation, // when this promise resolves, stop the simulation
	} = {}
) {
	// Compute values.
	const N = d3.map(nodes, nodeId).map(intern);
	const LS = d3.map(links, linkSource).map(intern);
	const LT = d3.map(links, linkTarget).map(intern);
	if (nodeTitle === undefined) nodeTitle = (_, i) => N[i];
	const T = nodeTitle == null ? null : d3.map(nodes, nodeTitle);
	const G = nodeGroup == null ? null : d3.map(nodes, nodeGroup).map(intern);
	const W =
		typeof linkStrokeWidth !== "function"
			? null
			: d3.map(links, linkStrokeWidth);

	// Replace the input nodes and links with mutable objects for the simulation.
	nodes = d3.map(nodes, (_, i) => ({ id: N[i] }));
	links = d3.map(links, (_, i) => ({ source: LS[i], target: LT[i] }));

	// Compute default domains.
	if (G && nodeGroups === undefined) nodeGroups = d3.sort(G);

	// Construct the scales.
	const color =
		nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);

	// Construct the forces.
	const forceNode = d3.forceManyBody();
	const forceLink = d3.forceLink(links).id(({ index: i }) => N[i]);
	if (nodeStrength !== undefined) forceNode.strength(nodeStrength);
	if (linkStrength !== undefined) forceLink.strength(linkStrength);

	const simulation = d3
		.forceSimulation(nodes)
		.force("link", forceLink)
		.force("charge", forceNode)
		.force("x", d3.forceX())
		.force("y", d3.forceY())
		.on("tick", ticked);

	const svg = d3
		.create("svg")
		.attr("width", width)
		.attr("height", height)
		.attr("viewBox", [-width / 2, -height / 2, width, height])
		.attr("style", "max-width: 100%; height: auto; height: intrinsic;");

	const link = svg
		.append("g")
		.attr("stroke", linkStroke)
		.attr("stroke-opacity", linkStrokeOpacity)
		.attr(
			"stroke-width",
			typeof linkStrokeWidth !== "function" ? linkStrokeWidth : null
		)
		.attr("stroke-linecap", linkStrokeLinecap)
		.selectAll("line")
		.data(links)
		.join("line");

	if (W) link.attr("stroke-width", ({ index: i }) => W[i]);

	const node = svg
		.append("g")
		.attr("fill", nodeFill)
		.attr("stroke", nodeStroke)
		.attr("stroke-opacity", nodeStrokeOpacity)
		.attr("stroke-width", nodeStrokeWidth)
		.selectAll("circle")
		.data(nodes)
		.join("circle")
		.attr("r", nodeRadius)
		.call(drag(simulation));

	if (G) node.attr("fill", ({ index: i }) => color(G[i]));
	if (T) node.append("title").text(({ index: i }) => T[i]);

	// Handle invalidation.
	if (invalidation != null) invalidation.then(() => simulation.stop());

	function intern(value) {
		return value !== null && typeof value === "object"
			? value.valueOf()
			: value;
	}

	function ticked() {
		link.attr("x1", (d) => d.source.x)
			.attr("y1", (d) => d.source.y)
			.attr("x2", (d) => d.target.x)
			.attr("y2", (d) => d.target.y);

		node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
	}

	function drag(simulation) {
		function dragstarted(event) {
			if (!event.active) simulation.alphaTarget(0.3).restart();
			event.subject.fx = event.subject.x;
			event.subject.fy = event.subject.y;
		}

		function dragged(event) {
			event.subject.fx = event.x;
			event.subject.fy = event.y;
		}

		function dragended(event) {
			if (!event.active) simulation.alphaTarget(0);
			event.subject.fx = null;
			event.subject.fy = null;
		}

		return d3
			.drag()
			.on("start", dragstarted)
			.on("drag", dragged)
			.on("end", dragended);
	}

	return Object.assign(svg.node(), { scales: { color } });
}
